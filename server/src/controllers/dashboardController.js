import mongoose from 'mongoose';
import Field from "../models/Field.js";
import CropCycle from "../models/CropCycle.js";
import CropPlan from "../models/CropPlan.js";
import Task from "../models/Task.js";
import SoilTest from "../models/SoilTest.js";
import Recommendation from "../models/Recommendation.js";

import { getWeatherForLocation } from "../services/weatherService.js";
import { getMarketPrices } from "../services/marketService.js";


const timedRequest = async (
  label,
  requestPromise
) => {
  const start = Date.now();

  try {
    const result = await requestPromise;

    console.log(
      `[DASHBOARD][${label}] completed in ${
        Date.now() - start
      }ms`
    );

    return result;
  } catch (error) {
    console.error(
      `[DASHBOARD][${label}] failed after ${
        Date.now() - start
      }ms:`,
      error.message
    );

    throw error;
  }
};

 const withTimeout = (promise, timeoutMs, fallback, label) => {
  return Promise.race([
    promise,

    new Promise((resolve) => {
      setTimeout(() => {
        console.warn(
          `[DASHBOARD][${label}] timed out after ${timeoutMs}ms`
        );

        resolve(fallback);
      }, timeoutMs);
    }),
  ]);
};




export const getCropCycleDashboard = async (req, res) => {
  try {
    const { cropCycleId } = req.params;


    const cropCycle = await CropCycle.findById(
      cropCycleId
    )
      .populate(
        "cropId",
        "name scientificName"
      )
      .lean();

    if (!cropCycle) {
      return res.status(404).json({
        message: "Crop cycle not found",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    }).lean();

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to access this dashboard",
      });
    }

    const [
      cropPlan,
      tasks,
      latestSoilTest,
      recommendation,
    ] = await Promise.all([
      CropPlan.findOne({
        cropCycleId: cropCycle._id,
      }).lean(),

      Task.find({
        cropCycleId: cropCycle._id,
      })
        .sort({
          stageOrder: 1,
          scheduledDate: 1,
        })
        .lean(),

      SoilTest.findOne({
        fieldId: field._id,
      })
        .sort({
          testedAt: -1,
        })
        .lean(),

      cropCycle.recommendationId
        ? Recommendation.findById(
            cropCycle.recommendationId
          )
            .populate(
              "results.cropId",
              "name scientificName"
            )
            .lean()
        : null,
    ]);

       const stages = Array.isArray(
      cropPlan?.stages
    )
      ? cropPlan.stages
      : [];

    const currentStage =
      stages.find(
        (stage) =>
          Number(stage?.order) ===
          Number(
            cropCycle.currentStageOrder
          )
      ) || null;

    const totalStages =
      stages.length;

    const completedStages = Math.max(
      0,
      Number(
        cropCycle.currentStageOrder || 1
      ) - 1
    );

    const progressPercentage =
      totalStages > 0
        ? Math.round(
            (completedStages /
              totalStages) *
              100
          )
        : 0;

    const completedTasks =
      tasks.filter(
        (task) =>
          task.status === "completed"
      ).length;

    
const weatherPromise = withTimeout(
  getWeatherForLocation({
    state: field.location?.state,
    district: field.location?.district,
  }).catch((error) => {
    console.error(
      "[DASHBOARD][WEATHER] failed:",
      error.message
    );

    return null;
  }),
  3000,
  null,
  "WEATHER"
);

const marketPromise = cropCycle.cropId?.name
  ? withTimeout(
      getMarketPrices({
        state: field.location?.state,
        district: field.location?.district,
        commodity: cropCycle.cropId.name,
      }).catch((error) => {
        console.error(
          "[DASHBOARD][MARKET] failed:",
          error.message
        );

        return {
          records: [],
          scope: "none",
        };
      }),
      3000,
      {
        records: [],
        scope: "none",
      },
      "MARKET"
    )
  : Promise.resolve({
      records: [],
      scope: "none",
    });

const [weather, market] = await Promise.all([
  weatherPromise,
  marketPromise,
]);
   
    return res.status(200).json({
      field: {
        id: field._id,
        name: field.name,
        area: field.area,
        areaUnit:
          field.areaUnit,
        location:
          field.location,
        soilType:
          field.soilType,
      },

      cropCycle: {
        id: cropCycle._id,
        status:
          cropCycle.status,
        startDate:
          cropCycle.startDate,
        expectedHarvestDate:
          cropCycle.expectedHarvestDate,
        actualHarvestDate:
          cropCycle.actualHarvestDate,
        currentStageOrder:
          cropCycle.currentStageOrder,
      },

      crop: cropCycle.cropId,

      currentStage,

      progress: {
        currentStageOrder:
          cropCycle.currentStageOrder,

        totalStages,

        completedStages,

        percentage:
          progressPercentage,

        totalTasks:
          tasks.length,

        completedTasks,
      },

      soilTest:
        latestSoilTest,

      recommendation,

      cropPlan,

      tasks,

      weather,

      market: {
        commodity:
          cropCycle.cropId?.name ||
          null,

        scope:
          market?.scope ||
          "none",

        records:
          Array.isArray(
            market?.records
          )
            ? market.records
            : [],
      },
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load crop dashboard",
      error: error.message,
    });
  }
};



export const getFarmDashboardSummary = async (req, res) => {
  try {
    
    const fields = await Field.find({
      farmerId: req.user._id,
    }).lean();

    if (!fields.length) {
      return res.status(200).json({
        summary: {
          totalFields: 0,
          activeCycles: 0,
          plannedCycles: 0,
          completedCycles: 0,
          fieldsNeedingAttention: 0,
          soilTestCoverage: 0,
        },

        todayTasks: {
          total: 0,
          pending: 0,
          completed: 0,
          records: [],
        },

        fields: [],
      });
    }

    const fieldIds = fields.map((field) => field._id);

   
    const cropCycles = await CropCycle.find({
      fieldId: {
        $in: fieldIds,
      },
    })
      .populate("cropId", "name scientificName")
      .lean();

    const cropCycleIds = cropCycles.map(
      (cycle) => cycle._id
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1
    );

    const [
      soilTests,
      tasks,
    ] = await Promise.all([
      SoilTest.find({
        fieldId: {
          $in: fieldIds,
        },
      })
        .sort({
          testedAt: -1,
        })
        .lean(),

      cropCycleIds.length
        ? Task.find({
            cropCycleId: {
              $in: cropCycleIds,
            },
          })
            .sort({
              scheduledDate: 1,
            })
            .lean()
        : [],
    ]);

    const cyclesByField = new Map();

    for (const cycle of cropCycles) {
      const fieldId = String(cycle.fieldId);

      if (!cyclesByField.has(fieldId)) {
        cyclesByField.set(fieldId, []);
      }

      cyclesByField.get(fieldId).push(cycle);
    }

    const tasksByCycle = new Map();

    for (const task of tasks) {
      const cycleId = String(task.cropCycleId);

      if (!tasksByCycle.has(cycleId)) {
        tasksByCycle.set(cycleId, []);
      }

      tasksByCycle.get(cycleId).push(task);
    }

    const latestSoilByField = new Map();

    for (const soilTest of soilTests) {
      const fieldId = String(
        soilTest.fieldId
      );

      if (!latestSoilByField.has(fieldId)) {
        latestSoilByField.set(
          fieldId,
          soilTest
        );
      }
    }

    const fieldSummaries = fields.map(
      (field) => {
        const fieldId = String(field._id);

        const fieldCycles =
          cyclesByField.get(fieldId) || [];

        
        const currentCycle =
          fieldCycles.find(
            (cycle) =>
              cycle.status === "active"
          ) ||
          fieldCycles.find(
            (cycle) =>
              cycle.status === "planned"
          ) ||
          [...fieldCycles].sort(
            (a, b) => {
              const dateA = a.startDate
                ? new Date(
                    a.startDate
                  ).getTime()
                : 0;

              const dateB = b.startDate
                ? new Date(
                    b.startDate
                  ).getTime()
                : 0;

              return dateB - dateA;
            }
          )[0] ||
          null;

        const fieldTasks =
          fieldCycles.flatMap((cycle) => {
            return (
              tasksByCycle.get(
                String(cycle._id)
              ) || []
            );
          });

        const todayTasks =
          fieldTasks.filter((task) => {
            if (!task.scheduledDate) {
              return false;
            }

            const scheduledDate =
              new Date(
                task.scheduledDate
              );

            return (
              scheduledDate >=
                todayStart &&
              scheduledDate <
                tomorrowStart
            );
          });

        const pendingTodayTasks =
          todayTasks.filter(
            (task) =>
              task.status !==
              "completed"
          );

        const overdueTasks =
          fieldTasks.filter((task) => {
            if (
              !task.scheduledDate ||
              task.status === "completed"
            ) {
              return false;
            }

            return (
              new Date(
                task.scheduledDate
              ) < todayStart
            );
          });

        const latestSoilTest =
          latestSoilByField.get(
            fieldId
          ) || null;

        const attentionReasons = [];

        if (!latestSoilTest) {
          attentionReasons.push(
            "Soil test needed"
          );
        }

        const hasActiveOrPlannedCycle =
          fieldCycles.some(
            (cycle) =>
              cycle.status === "active" ||
              cycle.status === "planned"
          );

        if (!hasActiveOrPlannedCycle) {
          attentionReasons.push(
            "No active crop cycle"
          );
        }

        if (overdueTasks.length > 0) {
          attentionReasons.push(
            `${overdueTasks.length} overdue task${
              overdueTasks.length > 1
                ? "s"
                : ""
            }`
          );
        }

        return {
          id: field._id,
          name: field.name,
          area: field.area,
          areaUnit: field.areaUnit,
          location: field.location,
          soilType: field.soilType,

          soilTest: {
            available: Boolean(
              latestSoilTest
            ),
            testedAt:
              latestSoilTest?.testedAt ||
              null,
          },

          cropCycle: currentCycle
            ? {
                id: currentCycle._id,
                status:
                  currentCycle.status,
                crop:
                  currentCycle.cropId
                    ?.name || null,
                currentStageOrder:
                  currentCycle.currentStageOrder,
                startDate:
                  currentCycle.startDate,
                expectedHarvestDate:
                  currentCycle.expectedHarvestDate,
              }
            : null,

          tasks: {
            today: todayTasks.length,
            pendingToday:
              pendingTodayTasks.length,
            overdue:
              overdueTasks.length,
          },

          needsAttention:
            attentionReasons.length > 0,

          attentionReasons,
        };
      }
    );

    const activeCycles =
      cropCycles.filter(
        (cycle) =>
          cycle.status === "active"
      ).length;

    const plannedCycles =
      cropCycles.filter(
        (cycle) =>
          cycle.status === "planned"
      ).length;

    const completedCycles =
      cropCycles.filter(
        (cycle) =>
          cycle.status === "completed"
      ).length;


    const fieldsWithSoilTest =
      fieldSummaries.filter(
        (field) =>
          field.soilTest.available
      ).length;

    const soilTestCoverage = Math.round(
      (fieldsWithSoilTest /
        fields.length) *
        100
    );

    
    const fieldsNeedingAttention =
      fieldSummaries.filter(
        (field) =>
          field.needsAttention
      ).length;

   
    const todayFarmTasks =
      tasks.filter((task) => {
        if (!task.scheduledDate) {
          return false;
        }

        const scheduledDate =
          new Date(
            task.scheduledDate
          );

        return (
          scheduledDate >= todayStart &&
          scheduledDate <
            tomorrowStart
        );
      });

    const completedTodayTasks =
      todayFarmTasks.filter(
        (task) =>
          task.status === "completed"
      ).length;

    const pendingTodayFarmTasks =
      todayFarmTasks.filter(
        (task) =>
          task.status !== "completed"
      ).length;

    
    const cycleMap = new Map();

    for (const cycle of cropCycles) {
      cycleMap.set(
        String(cycle._id),
        cycle
      );
    }

    const fieldMap = new Map();

    for (const field of fields) {
      fieldMap.set(
        String(field._id),
        field
      );
    }

    const todayTaskRecords =
      todayFarmTasks.map((task) => {
        const cycle =
          cycleMap.get(
            String(
              task.cropCycleId
            )
          );

        const field =
          cycle
            ? fieldMap.get(
                String(
                  cycle.fieldId
                )
              )
            : null;

        return {
          id: task._id,
          title: task.title,
          description:
            task.description,
          scheduledDate:
            task.scheduledDate,
          status: task.status,
          stageOrder:
            task.stageOrder,

          field: field
            ? {
                id: field._id,
                name: field.name,
              }
            : null,

          crop: cycle?.cropId
            ? {
                id: cycle.cropId._id,
                name:
                  cycle.cropId.name,
              }
            : null,

          cropCycleId:
            cycle?._id || null,
        };
      });

    
    return res.status(200).json({
      summary: {
        totalFields: fields.length,

        activeCycles,

        plannedCycles,

        completedCycles,

        fieldsNeedingAttention,

        soilTestCoverage,
      },

      todayTasks: {
        total:
          todayFarmTasks.length,

        pending:
          pendingTodayFarmTasks,

        completed:
          completedTodayTasks,

        records:
          todayTaskRecords,
      },

      fields:
        fieldSummaries,
    });
  } catch (error) {
    console.error(
      "Farm dashboard summary error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load farm dashboard summary",
      error: error.message,
    });
  }
};

export const getCropCycleDashboardSupplementary = async (
  req,
  res
) => {
  try {
    const { cropCycleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cropCycleId)) {
      return res.status(400).json({
        message: "Invalid crop cycle ID",
      });
    }

    const cropCycle = await CropCycle.findById(
      cropCycleId
    )
      .populate("cropId", "name")
      .lean();

    if (!cropCycle) {
      return res.status(404).json({
        message: "Crop cycle not found",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    }).lean();

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to view this crop cycle",
      });
    }

    const weatherPromise = withTimeout(
      getWeatherForLocation({
        state: field.location?.state,
        district: field.location?.district,
      }).catch((error) => {
        console.error(
          "[DASHBOARD SUPPLEMENTARY][WEATHER] failed:",
          error.message
        );

        return null;
      }),
      3000,
      null,
      "SUPPLEMENTARY WEATHER"
    );

    const marketPromise = cropCycle.cropId?.name
      ? withTimeout(
          getMarketPrices({
            state: field.location?.state,
            district: field.location?.district,
            commodity: cropCycle.cropId.name,
          }).catch((error) => {
            console.error(
              "[DASHBOARD SUPPLEMENTARY][MARKET] failed:",
              error.message
            );

            return {
              records: [],
              scope: "none",
            };
          }),
          3000,
          {
            records: [],
            scope: "none",
          },
          "SUPPLEMENTARY MARKET"
        )
      : Promise.resolve({
          records: [],
          scope: "none",
        });

    const [weather, market] =
      await Promise.all([
        weatherPromise,
        marketPromise,
      ]);

    return res.status(200).json({
      weather,
      market,
    });
  } catch (error) {
    console.error(
      "Get crop cycle dashboard supplementary error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch supplementary dashboard data",
      error: error.message,
    });
  }
};