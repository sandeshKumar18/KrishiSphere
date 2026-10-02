import mongoose from "mongoose";
import dotenv from "dotenv";
import Crop from "../models/Crop.js";

dotenv.config();

const growthStages = [
  {
    order: 1,
    name: "Germination and Establishment",
    description:
      "Seed germination and early establishment of the crop.",
  },
  {
    order: 2,
    name: "Vegetative Growth",
    description:
      "The plant develops leaves, branches, and overall vegetative growth.",
  },
  {
    order: 3,
    name: "Flowering",
    description:
      "The crop enters the flowering stage.",
  },
  {
    order: 4,
    name: "Pod Development",
    description:
      "Pods develop and seeds form and enlarge.",
  },
  {
    order: 5,
    name: "Maturity and Harvest",
    description:
      "The crop reaches maturity and is harvested.",
  },
];

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const crop = await Crop.findOneAndUpdate(
    { name: "Pigeon Peas (Tur/Arhar)" },
    { $set: { growthStages } },
    { new: true }
  );

  if (!crop) {
    console.log("Pigeon Peas crop not found.");
  } else {
    console.log("Pigeon Peas growth stages updated successfully.");
    console.log(crop);
  }

  await mongoose.disconnect();
} catch (error) {
  console.error("Seed error:", error);
  await mongoose.disconnect();
}