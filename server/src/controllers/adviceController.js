import Field from "../models/Field.js";
import CropCycle from "../models/CropCycle.js";
import CropPlan from "../models/CropPlan.js";
import SoilTest from "../models/SoilTest.js";
import Recommendation from "../models/Recommendation.js";

import { generateCropAdvice } from "../services/adviceService.js";

export const getCropAdvice = async (req, res) => {
  try {
    const { cropCycleId } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        message: "question is required",
      });
    }

    const cropCycle = await CropCycle.findById(cropCycleId)
      .populate("cropId", "name scientificName");

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
        message: "You are not authorized to access this crop cycle",
      });
    }

    const cropPlan = await CropPlan.findOne({
      cropCycleId: cropCycle._id,
    });

    const latestSoilTest = await SoilTest.findOne({
      fieldId: field._id,
    }).sort({ testedAt: -1 });

    const recommendation = await Recommendation.findById(
      cropCycle.recommendationId
    );

    const currentStage =
      cropPlan?.stages?.find(
        (stage) => stage.order === cropCycle.currentStageOrder
      ) || null;

    const context = {
      field: {
        name: field.name,
        area: field.area,
        areaUnit: field.areaUnit,
        soilType: field.soilType,
        location: field.location,
      },

      crop: {
        name: cropCycle.cropId?.name,
        scientificName: cropCycle.cropId?.scientificName,
      },

      cropCycle: {
        startDate: cropCycle.startDate,
        expectedHarvestDate: cropCycle.expectedHarvestDate,
        status: cropCycle.status,
        currentStageOrder: cropCycle.currentStageOrder,
      },

      currentStage: currentStage
        ? {
            order: currentStage.order,
            name: currentStage.name,
            description: currentStage.description,
          }
        : null,

      soil: latestSoilTest
        ? {
            testedAt: latestSoilTest.testedAt,
            nitrogen: latestSoilTest.nitrogen,
            phosphorus: latestSoilTest.phosphorus,
            potassium: latestSoilTest.potassium,
            pH: latestSoilTest.pH,
            moisture: latestSoilTest.moisture,
            source: latestSoilTest.source,
          }
        : null,

      environment: recommendation?.environmentalSnapshot || null,
    };

    const advice = await generateCropAdvice(
      context,
      question
    );

    return res.status(200).json({
      question,
      context,
      advice,
    });
  } catch (error) {
    console.error("Crop advice error:", error);

    return res.status(500).json({
      message: "Failed to generate crop advice",
      error: error.message,
    });
  }
};