import mongoose from "mongoose";

const cropCycleSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
      index: true,
    },

    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },

    recommendationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recommendation",
    },

    startDate: {
      type: Date,
      required: true,
    },

    expectedHarvestDate: {
      type: Date,
    },

    actualHarvestDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["planned", "active", "completed", "cancelled"],
      default: "planned",
    },

    currentStageOrder: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

cropCycleSchema.index({ fieldId: 1, status: 1 });
export default mongoose.model("CropCycle", cropCycleSchema);