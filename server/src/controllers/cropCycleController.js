import mongoose from "mongoose";
import Field from "../models/Field.js";
import Crop from "../models/Crop.js";
import Recommendation from "../models/Recommendation.js";
import CropCycle from "../models/CropCycle.js";
import CropPlan from "../models/CropPlan.js";
import Task from "../models/Task.js";



const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const isFinitePositiveInteger = (value) =>
  Number.isInteger(value) && value > 0;

const parseValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const createCropCycle = async (req, res) => {
  let createdCropCycle = null;

  try {
    const { recommendationId } = req.params;
    const {
      startDate,
      expectedHarvestDate,
    } = req.body;

    if (!isValidObjectId(recommendationId)) {
      return res.status(400).json({
        message: "Invalid recommendation ID",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        message: "startDate is required",
      });
    }

    const start = parseValidDate(startDate);

    if (!start) {
      return res.status(400).json({
        message: "Invalid startDate",
      });
    }

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        message: "Invalid startDate",
      });
    }

    const recommendation = await Recommendation.findById(
      recommendationId
    );

    if (!recommendation) {
      return res.status(404).json({
        message: "Recommendation not found",
      });
    }

   
    const field = await Field.findOne({
      _id: recommendation.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to use this recommendation",
      });
    }

  
    if (!recommendation.selectedCropId) {
      return res.status(400).json({
        message:
          "Please select a crop before creating a crop cycle",
      });
    }

    const selectedRecommendationResult = recommendation.results?.find(
      (result) =>
        result.cropId &&
        result.cropId.toString() === recommendation.selectedCropId.toString()
    );

    if (!selectedRecommendationResult) {
      return res.status(409).json({
        message: "The selected crop is not part of this recommendation.",
      });
    }

    const isSelectedCropRecommended =
      recommendation.results.some(
        (result) =>
          result.cropId.toString() ===
          recommendation.selectedCropId.toString()
      );

    if (!isSelectedCropRecommended) {
      return res.status(400).json({
        message:
          "Selected crop is not part of this recommendation",
      });
    }

    const crop = await Crop.findById(
      recommendation.selectedCropId
    );

    if (!crop) {
      return res.status(404).json({
        message: "Selected crop not found",
      });
    }

    if (!crop.growthStages || crop.growthStages.length === 0) {
      return res.status(400).json({
        message:
          "Growth stage data is not available for this crop yet",
      });
    }

    const existingCycle = await CropCycle.findOne({
      fieldId: field._id,
      status: {
        $in: ["planned", "active"],
      },
    });

    if (existingCycle) {
      return res.status(400).json({
        message:
          "This field already has an active or planned crop cycle",
      });
    }

    let harvestDate;

    if (expectedHarvestDate) { harvestDate = parseValidDate(expectedHarvestDate);

      if (!harvestDate) {
        return res.status(400).json({
          message: "Invalid expectedHarvestDate",
        });
      }

      if (harvestDate <= start) {
        return res.status(400).json({
          message:
            "expectedHarvestDate must be after startDate",
        });
      }
    } else if (crop.durationDays?.max) {
      harvestDate = new Date(start);

      harvestDate.setDate(
        harvestDate.getDate() +
          crop.durationDays.max
      );
    } else {
      return res.status(400).json({
        message:
          "Crop duration is not available. Please provide expectedHarvestDate.",
      });
    }

    createdCropCycle = await CropCycle.create({
      fieldId: field._id,
      cropId: crop._id,
      recommendationId: recommendation._id,
      startDate: start,
      expectedHarvestDate: harvestDate,
      status: "active",
      currentStageOrder: 1,
    });


    const stages = [...crop.growthStages]
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        order: stage.order,
        name: stage.name,
        startDay: stage.startDay,
        endDay: stage.endDay,
        description: stage.description,
      }));

    const cropPlan = await CropPlan.create({
      cropCycleId: createdCropCycle._id,
      version: 1,
      source: "template",
      stages,
    });


    const currentStage = stages.find(
      (stage) => stage.order === 1
    );

    if (!currentStage) {
      throw new Error(
        "Crop plan does not contain stage 1"
      );
    }


    const firstTask = await Task.create({
      cropCycleId: createdCropCycle._id,
      stageOrder: currentStage.order,
      title: `Review ${currentStage.name} stage`,
      description:
        currentStage.description ||
        `Work through the ${currentStage.name} stage.`,
      scheduledDate: start,
      status: "pending",
    });

    return res.status(201).json({
      message:
        "Crop cycle, crop plan, and first task created successfully",

      cropCycle: createdCropCycle,

      cropPlan,

      currentStage,

      firstTask,
    });
  } catch (error) {
    console.error(
      "Create crop cycle error:",
      error
    );


    if (createdCropCycle?._id) {
      try {
        await Task.deleteMany({
          cropCycleId: createdCropCycle._id,
        });

        await CropPlan.deleteMany({
          cropCycleId: createdCropCycle._id,
        });

        await CropCycle.deleteOne({
          _id: createdCropCycle._id,
        });
      } catch (cleanupError) {
        console.error(
          "Crop cycle cleanup error:",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      message: "Failed to create crop cycle",
      error: error.message,
    });
  }
};


export const getFieldCropCycles = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!isValidObjectId(fieldId)) {
      return res.status(400).json({
        message: "Invalid field ID",
      });
    }

    const field = await Field.findOne({
      _id: fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(404).json({
        message: "Field not found",
      });
    }

    const cropCycles = await CropCycle.find({
      fieldId,
    })
      .populate("cropId", "name scientificName")
      .sort({ startDate: -1 });

    return res.status(200).json({
      cropCycles,
    });
  } catch (error) {
    console.error("Get crop cycles error:", error);

    return res.status(500).json({
      message: "Failed to fetch crop cycles",
      error: error.message,
    });
  }
};

export const getAllCropCycles = async (req, res) => {
  try {
    const fields = await Field.find({
      farmerId: req.user._id,
    }).select("_id");

    const fieldIds = fields.map((field) => field._id);

    if (fieldIds.length === 0) {
      return res.status(200).json({
        cropCycles: [],
      });
    }

    const cropCycles = await CropCycle.find({
      fieldId: {
        $in: fieldIds,
      },
    })
      .populate("cropId", "name scientificName")
      .sort({ startDate: -1 })
      .lean();

    return res.status(200).json({
      cropCycles,
    });
  } catch (error) {
    console.error("Get all crop cycles error:", error);

    return res.status(500).json({
      message: "Failed to fetch crop cycles",
      error: error.message,
    });
  }
};


export const updateCropCycleStage = async (req, res) => {
  try {
    const { cropCycleId } = req.params;
    const { stageOrder } = req.body;

    if (stageOrder === undefined) {
        return res.status(400).json({
          message: "stageOrder is required",
        });
      }

      const parsedStageOrder = Number(stageOrder);

      if (!isFinitePositiveInteger(parsedStageOrder)) {
        return res.status(400).json({
          message:
            "stageOrder must be a positive integer",
        });
      }

    const requestedStageOrder = Number(stageOrder);

    if (!Number.isInteger(requestedStageOrder)) {
      return res.status(400).json({
        message: "stageOrder must be an integer",
      });
    }

    if (!isValidObjectId(cropCycleId)) {
      return res.status(400).json({
        message: "Invalid crop cycle ID",
      });
    }

const cropCycle =
  await CropCycle.findById(cropCycleId);

    if (!cropCycle) {
      return res.status(404).json({
        message: "Crop cycle not found",
      });
    }

    if (cropCycle.status === "completed") {
      return res.status(400).json({
        message: "Completed crop cycle cannot change stage",
      });
    }

    if (cropCycle.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled crop cycle cannot change stage",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to update this crop cycle",
      });
    }

    const cropPlan = await CropPlan.findOne({
      cropCycleId: cropCycle._id,
    });

    if (!cropPlan) {
      return res.status(400).json({
        message: "Crop plan does not exist",
      });
    }


    const expectedNextStage =
      cropCycle.currentStageOrder + 1;

    if (
      requestedStageOrder !==
      expectedNextStage
    ) {
      return res.status(400).json({
        message:
          "You can only move to the next crop stage",
      });
    }

    const stage = cropPlan.stages.find(
      (item) =>
        item.order === parsedStageOrder
    );

    if (!stage) {
      return res.status(400).json({
        message: "Invalid stageOrder",
      });
    }

    const currentStageTasks =
      await Task.find({
        cropCycleId: cropCycle._id,
        stageOrder:
          cropCycle.currentStageOrder,
      });


    if (currentStageTasks.length === 0) {
      return res.status(400).json({
        message:
          "No tasks exist for the current stage. Generate the current-stage tasks before moving forward",
      });
    }


    const incompleteTasks =
      currentStageTasks.filter(
        (task) =>
          task.status !== "completed"
      );

    if (incompleteTasks.length > 0) {
      return res.status(400).json({
        message:
          "Complete all current-stage tasks before moving to the next stage",
      });
    }

    cropCycle.currentStageOrder = parsedStageOrder;

    if (cropCycle.status === "planned") {
      cropCycle.status = "active";
    }

    await cropCycle.save();

    return res.status(200).json({
      message:
        "Crop cycle stage updated successfully",
      cropCycle,
      currentStage: stage,
    });
  } catch (error) {
    console.error(
      "Update crop stage error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update crop cycle stage",
      error: error.message,
    });
  }
};

export const updateCropCycleStatus = async (req, res) => {
  try {
    const { cropCycleId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(cropCycleId)) {
      return res.status(400).json({
        message: "Invalid crop cycle ID.",
      });
    }

    if (
      typeof status !== "string" ||
      ![
        "planned",
        "active",
        "completed",
        "cancelled",
      ].includes(status.trim())
    ) {
      return res.status(400).json({
        message:
          "Invalid status. Allowed values are planned, active, completed, or cancelled.",
      });
    }

    const nextStatus = status.trim();

    const cropCycle =
      await CropCycle.findById(cropCycleId);

    if (!cropCycle) {
      return res.status(404).json({
        message: "Crop cycle not found.",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not allowed to modify this crop cycle.",
      });
    }

    if (cropCycle.status === nextStatus) {
      return res.status(200).json({
        message:
          "Crop cycle status is already set to this value.",
        cropCycle,
      });
    }

    const allowedTransitions = {
      planned: ["active", "cancelled"],
      active: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (
      !allowedTransitions[
        cropCycle.status
      ]?.includes(nextStatus)
    ) {
      return res.status(409).json({
        message:
          `Cannot change crop cycle from ${cropCycle.status} to ${nextStatus}.`,
      });
    }

    
    if (nextStatus === "completed") {
      const cropPlan =
        await CropPlan.findOne({
          cropCycleId:
            cropCycle._id,
        });

      if (!cropPlan) {
        return res.status(409).json({
          message:
            "Crop plan not found for this crop cycle.",
        });
      }

      
      let planStages = [];

      if (
        Array.isArray(cropPlan.growthStages)
      ) {
        planStages = cropPlan.growthStages;
      } else if (
        Array.isArray(cropPlan.stages)
      ) {
        planStages =  cropPlan.stages;
      }

      
      if (planStages.length === 0) {
        const crop =
          await Crop.findById(
            cropCycle.cropId
          );

        if (
          Array.isArray(
            crop?.growthStages
          )
        ) {
          planStages =
            crop.growthStages;
        }
      }

     
      if (planStages.length === 0) {
        return res.status(409).json({
          message:
            "Crop growth stages are missing for this crop cycle. The crop plan must contain at least one growth stage before the cycle can be completed.",
        });
      }

      const finalStageOrder =
        planStages.reduce(
          (maxOrder, stage, index) => {
            const stageOrder = Number(
              stage?.order ??
                stage?.stageOrder ??
                stage?.sequence ??
                index + 1
            );

            if (
              !Number.isFinite(
                stageOrder
              )
            ) {
              return maxOrder;
            }

            return Math.max(
              maxOrder,
              stageOrder
            );
          },
          0
        );

      if (
        finalStageOrder <= 0
      ) {
        return res.status(409).json({
          message:
            "Unable to determine the final growth stage for this crop cycle.",
        });
      }

     
      if (
        Number(
          cropCycle.currentStageOrder
        ) !== finalStageOrder
      ) {
        return res.status(409).json({
          message:
            "Crop cycle cannot be completed before reaching the final growth stage.",
          currentStage:
            cropCycle.currentStageOrder,
          finalStage:
            finalStageOrder,
        });
      }

     
      const incompleteTasks =
        await Task.countDocuments({
          cropCycleId:
            cropCycle._id,

          status: {
            $ne: "completed",
          },
        });

      if (incompleteTasks > 0) {
        return res.status(409).json({
          message:
            "All crop cycle tasks must be completed before completing the crop cycle.",
          incompleteTasks,
        });
      }

      cropCycle.actualHarvestDate =
        new Date();
    }

    cropCycle.status =
      nextStatus;

    await cropCycle.save();

    return res.status(200).json({
      message:
        `Crop cycle marked as ${nextStatus}.`,
      cropCycle,
    });
  } catch (error) {
    console.error(
      "UPDATE CROP CYCLE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to update crop cycle status.",
      error: error.message,
    });
  }
};



export const getCropCycleProgress = async (req, res) => {
  try {
    const { cropCycleId } = req.params;

    if (!isValidObjectId(cropCycleId)) {
      return res.status(400).json({
        message: "Invalid crop cycle ID",
      });
    }

    const cropCycle = await CropCycle.findById(cropCycleId)
      .populate("cropId", "name scientificName");

    if (!cropCycle) {
      return res.status(404).json({
        message: "Crop cycle not found",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message: "You are not authorized to view this crop cycle",
      });
    }

    const cropPlan = await CropPlan.findOne({
      cropCycleId: cropCycle._id,
    });

    if (!cropPlan) {
      return res.status(400).json({
        message: "Crop plan does not exist",
      });
    }

    const currentStage = cropPlan.stages.find(
      (stage) => stage.order === cropCycle.currentStageOrder
    );

    const totalStages = cropPlan.stages.length;

    const completedStages = Math.max(
      0,
      cropCycle.currentStageOrder - 1
    );

    const progressPercentage =
      totalStages === 0
        ? 0
        : Math.round((completedStages / totalStages) * 100);

    const tasks = await Task.find({
      cropCycleId: cropCycle._id,
    }).sort({
      stageOrder: 1,
      scheduledDate: 1,
    });

    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    return res.status(200).json({
      cropCycle,
      cropPlan,
      currentStage,
      progress: {
        currentStageOrder: cropCycle.currentStageOrder,
        totalStages,
        completedStages,
        percentage: progressPercentage,
        totalTasks: tasks.length,
        completedTasks,
      },
      tasks,
    });
  } catch (error) {
    console.error("Get crop progress error:", error);

    return res.status(500).json({
      message: "Failed to fetch crop progress",
      error: error.message,
    });
  }
};