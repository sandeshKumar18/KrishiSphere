import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    cropCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropCycle",
      required: true,
      index: true,
    },

    stageOrder: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    scheduledDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ cropCycleId: 1, status: 1 });
taskSchema.index({ cropCycleId: 1, scheduledDate: 1 });

export default mongoose.model("Task", taskSchema);