import mongoose from "mongoose";
import dotenv from "dotenv";

import Crop from "../models/Crop.js";

dotenv.config();

const seedPomegranate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const pomegranateData = {
      scientificName: "Punica granatum L.",

      seasons: [
        "Mrig Bahar",
        "Hasta Bahar",
        "Ambe Bahar",
      ],

      durationDays: {
        min: 135,
        max: 180,
      },

      growthStages: [
        {
          order: 1,
          name: "Before Flowering",
          description:
            "Pre-flowering management phase before blossom initiation.",
        },
        {
          order: 2,
          name: "Flowering",
          description:
            "Bahar and flowering phase. Pomegranate can have multiple flowering periods, with one commercial bahar generally selected for the year.",
        },
        {
          order: 3,
          name: "Fruit Setting and Development",
          description:
            "Fruit set and development phase. Adequate soil and environmental moisture should be maintained.",
        },
        {
          order: 4,
          name: "Fruit Maturity and Harvest",
          description:
            "Fruit reaches harvest maturity. NHB reports approximately 135–180 days from appearance of blossom, depending on cultivar.",
        },
        {
          order: 5,
          name: "Post Harvest",
          description:
            "Post-harvest management phase following fruit removal.",
        },
      ],
    };

    const crop = await Crop.findOneAndUpdate(
      { name: "Pomegranate" },
      { $set: pomegranateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!crop) {
      throw new Error("Pomegranate crop not found");
    }

    console.log("Pomegranate data updated successfully");
    console.log(crop);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Pomegranate seeding failed:", error);
    process.exit(1);
  }
};

seedPomegranate();