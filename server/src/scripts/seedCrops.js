import "dotenv/config";
import mongoose from "mongoose";

import Crop from "../models/Crop.js";
import crops from "../data/crops.js";

const seedCrops = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    for (const crop of crops) {
      const existing = await Crop.findOne({
        name: crop.name,
      });

      if (existing) {
        existing.set(crop);
        await existing.save();

        console.log(`Updated: ${crop.name}`);
      } else {
        await Crop.create(crop);

        console.log(`Created: ${crop.name}`);
      }
    }

    console.log("\n Crop master seeding completed.");
  } catch (error) {
    console.error(" Crop seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedCrops();