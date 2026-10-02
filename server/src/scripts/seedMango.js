import mongoose from "mongoose";
import Crop from "../models/Crop.js";
import dotenv from "dotenv";

dotenv.config();

const mangoGrowthStages = [
  {
    name: "Bud and Vegetative Growth",
    order: 1,
    description:
      "Monitor new shoots, leaf development, tree growth, and overall vegetative condition.",
  },
  {
    name: "Inflorescence Development",
    order: 2,
    description:
      "Monitor panicle emergence and development before flowering.",
  },
  {
    name: "Flowering and Fruit Set",
    order: 3,
    description:
      "Monitor flowering, pollination, fruit set, and early fruit drop.",
  },
  {
    name: "Fruit Development",
    order: 4,
    description:
      "Monitor fruit growth, development, tree condition, and fruit retention.",
  },
  {
    name: "Fruit Maturity and Harvest",
    order: 5,
    description:
      "Monitor fruit maturity and prepare for harvesting when the crop reaches the appropriate maturity stage.",
  },
  {
    name: "Post-Harvest",
    order: 6,
    description:
      "Handle harvested fruit properly and review orchard condition after harvest.",
  },
];

const seedMango = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection string not found in environment variables."
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected.");

    const mango = await Crop.findOne({
      name: "Mango",
    });

    if (!mango) {
      console.log("Mango crop not found.");
      return;
    }

    mango.growthStages = mangoGrowthStages;

    await mango.save();

    console.log("Mango growth stages updated successfully.");

    console.log(
      JSON.stringify(
        {
          cropId: mango._id,
          cropName: mango.name,
          growthStages: mango.growthStages,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      "Failed to seed Mango:",
      error
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedMango();