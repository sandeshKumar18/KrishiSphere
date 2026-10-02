import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
      index: true,
    },

    soilTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SoilTest",
      required: true,
    },

    environmentalSnapshot: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
    },

    modelVersion: {
      type: String,
      required: true,
    },

    results: [
      {
        cropId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Crop",
          required: true,
        },

        rank: {
          type: Number,
          required: true,
          min: 1,
        },

        score: {
          type: Number,
          required: true,
        },
      },
    ],

    selectedCropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
    },

    selectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Recommendation",
  recommendationSchema
);