import Field from "../models/Field.js";
import CropCycle from "../models/CropCycle.js";
import CropPlan from "../models/CropPlan.js";

export const createCropPlan = async (req, res) => {
  try {
    const { cropCycleId } = req.params;

    const cropCycle = await CropCycle.findById(cropCycleId).populate("cropId");

    if (!cropCycle) {
      return res.status(404).json({
        message: "Crop cycle not found",
      });
    }

    const field = await Field.findOne({
      _id: cropCycle.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message: "You are not authorized to create a plan for this crop cycle",
      });
    }

    const crop = cropCycle.cropId;

    console.log("CROP USED FOR PLAN:", {
      id: crop?._id,
      name: crop?.name,
      growthStages: crop?.growthStages,
    });

    if (!crop) {
      return res.status(404).json({
        message: "Crop information not found",
      });
    }

    if (!crop.growthStages || crop.growthStages.length === 0) {
      return res.status(400).json({
        message:
          "Growth stage data is not available for this crop yet",
      });
    }

    const existingPlan = await CropPlan.findOne({
      cropCycleId: cropCycle._id,
    });

    if (existingPlan) {
      return res.status(400).json({
        message: "Crop plan already exists for this crop cycle",
        cropPlan: existingPlan,
      });
    }

    const stages = crop.growthStages.map((stage) => ({
      order: stage.order,
      name: stage.name,
      startDay: stage.startDay,
      endDay: stage.endDay,
      description: stage.description,
    }));

    const cropPlan = await CropPlan.create({
      cropCycleId: cropCycle._id,
      version: 1,
      source: "template",
      stages,
    });

    return res.status(201).json({
      message: "Crop plan created successfully",
      cropPlan,
    });
  } catch (error) {
    console.error("Create crop plan error:", error);

    return res.status(500).json({
      message: "Failed to create crop plan",
      error: error.message,
    });
  }
};