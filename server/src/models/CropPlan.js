import mongoose from "mongoose";

const cropPlanSchema = new mongoose.Schema(
  {
    cropCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropCycle",
      required: true,
      unique: true,
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    source: {
      type: String,
      enum: ["template", "ai_assisted", "manual"],
      default: "template",
    },

    stages: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        order: {
          type: Number,
          required: true,
          min: 1,
        },

        startDay: {
          type: Number,
          min: 0,
        },

        endDay: {
          type: Number,
          min: 0,
        },

        description: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CropPlan", cropPlanSchema);