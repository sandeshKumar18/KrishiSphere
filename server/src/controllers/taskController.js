import mongoose from "mongoose";

import Field from "../models/Field.js";
import CropCycle from "../models/CropCycle.js";
import CropPlan from "../models/CropPlan.js";
import Task from "../models/Task.js";

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const isPositiveInteger = (value) =>
  Number.isInteger(value) &&
  value > 0;

const isNonEmptyString = (value) =>
  typeof value === "string" &&
  value.trim().length > 0;

const parseValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

export const createTask = async (
  req,
  res
) => {
  try {
    const { cropCycleId } =
      req.params;

    const {
      stageOrder,
      title,
      description,
      scheduledDate,
    } = req.body;

    if (!isValidObjectId(cropCycleId)) {
      return res.status(400).json({
        message:
          "Invalid crop cycle ID",
      });
    }

    if (stageOrder === undefined) {
      return res.status(400).json({
        message:
          "stageOrder is required",
      });
    }

    const parsedStageOrder =
      Number(stageOrder);

    if (
      !isPositiveInteger(
        parsedStageOrder
      )
    ) {
      return res.status(400).json({
        message:
          "stageOrder must be a positive integer",
      });
    }

    if (!isNonEmptyString(title)) {
      return res.status(400).json({
        message:
          "Task title is required",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message:
          "Task description must be text",
      });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        message:
          "scheduledDate is required",
      });
    }

    const parsedScheduledDate =
      parseValidDate(
        scheduledDate
      );

    if (!parsedScheduledDate) {
      return res.status(400).json({
        message:
          "Invalid scheduledDate",
      });
    }

    const cropCycle =
      await CropCycle.findById(
        cropCycleId
      );

    if (!cropCycle) {
      return res.status(404).json({
        message:
          "Crop cycle not found",
      });
    }

    if (
      cropCycle.status ===
        "completed" ||
      cropCycle.status ===
        "cancelled"
    ) {
      return res.status(400).json({
        message:
          "Completed or cancelled crop cycle cannot have new tasks",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to manage this crop cycle",
      });
    }

    const cropPlan =
      await CropPlan.findOne({
        cropCycleId:
          cropCycle._id,
      });

    if (!cropPlan) {
      return res.status(400).json({
        message:
          "Crop plan does not exist yet",
      });
    }

    const stageExists =
      cropPlan.stages.some(
        (stage) =>
          stage.order ===
          parsedStageOrder
      );

    if (!stageExists) {
      return res.status(400).json({
        message:
          "Invalid stageOrder",
      });
    }

    const task =
      await Task.create({
        cropCycleId:
          cropCycle._id,
        stageOrder:
          parsedStageOrder,
        title: title.trim(),
        description:
          typeof description ===
          "string"
            ? description.trim()
            : description,
        scheduledDate:
          parsedScheduledDate,
        status: "pending",
      });

    return res.status(201).json({
      message:
        "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create task",
      error: error.message,
    });
  }
};

export const getCropCycleTasks = async (
  req,
  res
) => {
  try {
    const { cropCycleId } =
      req.params;

    if (!isValidObjectId(cropCycleId)) {
      return res.status(400).json({
        message:
          "Invalid crop cycle ID",
      });
    }

    const cropCycle =
      await CropCycle.findById(
        cropCycleId
      );

    if (!cropCycle) {
      return res.status(404).json({
        message:
          "Crop cycle not found",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to view these tasks",
      });
    }

    const tasks =
      await Task.find({
        cropCycleId,
      }).sort({
        stageOrder: 1,
        scheduledDate: 1,
      });

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch tasks",
      error: error.message,
    });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    if (
      typeof status !== "string" ||
      !["pending", "in_progress", "completed"].includes(
        status.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid task status. Allowed values are pending, in_progress, or completed.",
      });
    }

    const nextStatus = status.trim();

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const cropCycle = await CropCycle.findById(
      task.cropCycleId
    );

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
        message: "You are not allowed to modify this task.",
      });
    }

    if (
      cropCycle.status === "completed" ||
      cropCycle.status === "cancelled"
    ) {
      return res.status(409).json({
        message:
          "Tasks cannot be modified after the crop cycle is completed or cancelled.",
      });
    }

    if (task.status === nextStatus) {
      return res.status(200).json({
        message: "Task already has this status.",
        task,
      });
    }

    const allowedTransitions = {
      pending: ["in_progress", "completed"],
      in_progress: ["completed"],
      completed: [],
    };

    if (!allowedTransitions[task.status]?.includes(nextStatus)) {
      return res.status(409).json({
        message: `Cannot change task from ${task.status} to ${nextStatus}.`,
      });
    }

    task.status = nextStatus;

    if (nextStatus === "completed") {
      task.completedAt = new Date();
    }

    await task.save();

    return res.status(200).json({
      message: "Task status updated successfully.",
      task,
    });
  } catch (error) {
    console.error("UPDATE TASK STATUS ERROR:", error);

    return res.status(500).json({
      message: "Unable to update task status.",
      error: error.message,
    });
  }
};

export const generateCurrentStageTask =
  async (req, res) => {
    try {
      const { cropCycleId } =
        req.params;

      if (
        !isValidObjectId(
          cropCycleId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid crop cycle ID",
        });
      }

      const cropCycle =
        await CropCycle.findById(
          cropCycleId
        );

      if (!cropCycle) {
        return res.status(404).json({
          message:
            "Crop cycle not found",
        });
      }

      if (
        cropCycle.status ===
          "completed" ||
        cropCycle.status ===
          "cancelled"
      ) {
        return res.status(400).json({
          message:
            "Completed or cancelled crop cycle cannot generate tasks",
        });
      }

      const field =
        await Field.findOne({
          _id: cropCycle.fieldId,
          farmerId: req.user._id,
        });

      if (!field) {
        return res.status(403).json({
          message:
            "You are not authorized to manage this crop cycle",
        });
      }

      const cropPlan =
        await CropPlan.findOne({
          cropCycleId:
            cropCycle._id,
        });

      if (!cropPlan) {
        return res.status(400).json({
          message:
            "Crop plan does not exist",
        });
      }

      const currentStage =
        cropPlan.stages.find(
          (stage) =>
            stage.order ===
            cropCycle.currentStageOrder
        );

      if (!currentStage) {
        return res.status(400).json({
          message:
            "Current stage not found in crop plan",
        });
      }

    
      const existingTask =
        await Task.findOne({
          cropCycleId:
            cropCycle._id,
          stageOrder:
            currentStage.order,
        });

      if (existingTask) {
        return res.status(200).json({
          message:
            "Task already exists for the current stage",
          task: existingTask,
        });
      }

      const task =
        await Task.create({
          cropCycleId:
            cropCycle._id,
          stageOrder:
            currentStage.order,
          title: `Review ${currentStage.name} stage`,
          description:
            currentStage.description,
          scheduledDate:
            new Date(),
          status: "pending",
        });

      return res.status(201).json({
        message:
          "Current stage task generated successfully",
        task,
      });
    } catch (error) {
      console.error(
        "Generate stage task error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to generate stage task",
        error: error.message,
      });
    }
  };