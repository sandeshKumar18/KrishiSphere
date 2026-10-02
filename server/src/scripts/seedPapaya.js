import "dotenv/config";
import mongoose from "mongoose";

import Crop from "../models/Crop.js";

const papaya = {
  name: "Papaya",
  scientificName: "Carica papaya",

  description:
    "Papaya is a tropical fruit crop. Under suitable conditions, bearing can begin within about 8–10 months after planting, with production continuing for multiple years.",

  durationDays: {
    min: 240,
    max: 900,
  },

  seasons: ["Spring", "Monsoon", "Autumn"],

  nutrientRequirements: {},

  environmentalRequirements: {
    minTemperature: 22,
    maxTemperature: 35,

    minHumidity: 50,
    maxHumidity: 90,

    minRainfall: 1000,
    maxRainfall: 1500,

    minPH: 6.0,
    maxPH: 7.5,
  },

  growthStages: [
    {
      name: "Nursery and Germination",
      order: 1,
      startDay: 0,
      endDay: 45,
      description:
        "Seed germination, seedling establishment, nursery care, and preparation for field planting.",
    },

    {
      name: "Field Establishment",
      order: 2,
      startDay: 46,
      endDay: 120,
      description:
        "Transplant establishment and early root, stem, and leaf development after field planting.",
    },

    {
      name: "Vegetative Growth",
      order: 3,
      startDay: 121,
      endDay: 210,
      description:
        "Active canopy and plant growth leading toward reproductive development.",
    },

    {
      name: "Flowering and Fruit Set",
      order: 4,
      startDay: 211,
      endDay: 300,
      description:
        "Flowering, pollination, and early fruit set. Monitor plant health and field conditions closely.",
    },

    {
      name: "Fruit Development and Maturity",
      order: 5,
      startDay: 301,
      endDay: 360,
      description:
        "Fruit enlargement and maturation leading toward the first harvest window.",
    },

    {
      name: "Harvest and Continuous Production",
      order: 6,
      startDay: 361,
      endDay: 900,
      description:
        "Harvesting mature fruits and continuing crop management during the productive period.",
    },
  ],
};

const seedPapaya = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGO_URI is not configured.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existing = await Crop.findOne({
      name: "Papaya",
    });

    if (existing) {
      existing.set(papaya);
      await existing.save();

      console.log(" Papaya crop updated.");
      console.log(`Crop ID: ${existing._id}`);
    } else {
      const created = await Crop.create(papaya);

      console.log(" Papaya crop created.");
      console.log(`Crop ID: ${created._id}`);
    }
  } catch (error) {
    console.error(" Papaya seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedPapaya();