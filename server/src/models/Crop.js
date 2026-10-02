import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    scientificName: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    durationDays: {
      min: {
        type: Number,
        min: 0,
      },

      max: {
        type: Number,
        min: 0,
      },
    },

    seasons: [
      {
        type: String,
        trim: true,
      },
    ],

    nutrientRequirements: {
      nitrogen: {
        type: Number,
        min: 0,
      },

      phosphorus: {
        type: Number,
        min: 0,
      },

      potassium: {
        type: Number,
        min: 0,
      },
    },

    environmentalRequirements: {
      minTemperature: Number,
      maxTemperature: Number,
      minHumidity: Number,
      maxHumidity: Number,
      minRainfall: Number,
      maxRainfall: Number,
      minPH: Number,
      maxPH: Number,
    },

    growthStages: [
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

export default mongoose.model("Crop", cropSchema);