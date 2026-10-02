import mongoose from "mongoose";

import Field from "../models/Field.js";
import SoilTest from "../models/SoilTest.js";
import Crop from "../models/Crop.js";
import Recommendation from "../models/Recommendation.js";

import { predictCrop } from "../services/mlService.js";
import { getWeatherForLocation } from "../services/weatherService.js";

const ML_MODEL_VERSION = process.env.ML_MODEL_VERSION || "1.0.0";

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const isNonEmptyString = (value) =>
  typeof value === "string" &&
  value.trim().length > 0;

const isFiniteNumber = (value) =>
  typeof value === "number" &&
  Number.isFinite(value);

export const createRecommendation = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!isValidObjectId(fieldId)) {
      return res.status(400).json({
        message: "Invalid field ID",
      });
    }

    const field = await Field.findOne({
      _id: fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(404).json({
        message: "Field not found",
      });
    }

    const latestSoilTest = await SoilTest.findOne({
      fieldId,
    }).sort({ testedAt: -1 });

    if (!latestSoilTest) {
      return res.status(400).json({
        message:
          "Please add a soil test before requesting a recommendation",
      });
    }

    if (
      latestSoilTest.fieldId &&
      latestSoilTest.fieldId.toString() !== fieldId.toString()
    ) {
      return res.status(409).json({
        message: "Soil test does not belong to this field.",
      });
    }

    if (
      !isFiniteNumber(latestSoilTest.nitrogen) ||
      !isFiniteNumber(latestSoilTest.phosphorus) ||
      !isFiniteNumber(latestSoilTest.potassium) ||
      !isFiniteNumber(latestSoilTest.pH)
    ) {
      return res.status(400).json({
        message: "Latest soil test contains invalid numeric data",
      });
    }

    let weather;

    try {
      weather = await getWeatherForLocation({
        state: field.location.state,
        district: field.location.district,
      });
    } catch (error) {
      console.error("Weather service error:", error.message);

      return res.status(502).json({
        message: "Unable to retrieve weather data",
        error: error.message,
      });
    }

    if (
      !weather ||
      !isFiniteNumber(weather.temperature) ||
      !isFiniteNumber(weather.humidity) ||
      !isFiniteNumber(weather.rainfall)
    ) {
      return res.status(502).json({
        message: "Weather service returned invalid data",
      });
    }

    const mlInput = {
      N: latestSoilTest.nitrogen,
      P: latestSoilTest.phosphorus,
      K: latestSoilTest.potassium,
      temperature: weather.temperature,
      humidity: weather.humidity,
      ph: latestSoilTest.pH,
      rainfall: weather.rainfall,
    };

    const prediction = await predictCrop(mlInput);

    if (
      !prediction ||
      !Array.isArray(prediction.recommendations)
    ) {
      return res.status(502).json({
        message:
          "ML service returned an invalid recommendation response",
      });
    }

const validPredictions = prediction.recommendations.filter(
  (item) => {
    if (!item || !isNonEmptyString(item.crop)) {
      return false;
    }

    if (
      item.score !== undefined &&
      !isFiniteNumber(Number(item.score))
    ) {
      return false;
    }

    return true;
  }
);

const predictedCropNames = [
  ...new Set(
    validPredictions.map((item) =>
      item.crop.trim()
    )
  ),
];

const crops = await Crop.find({
  name: {
    $in: predictedCropNames,
  },
})
  .select("_id name")
  .lean();

const cropMap = new Map();

for (const crop of crops) {
  if (!cropMap.has(crop.name)) {
    cropMap.set(crop.name, crop);
  }
}

const cropResults = [];

for (
  let i = 0;
  i < validPredictions.length;
  i++
) {
  const item = validPredictions[i];
  const crop = cropMap.get(item.crop.trim());

  if (!crop) {
    continue;
  }

  cropResults.push({
    cropId: crop._id,
    rank: i + 1,
    score:
      item.score !== undefined
        ? Number(item.score)
        : 0,
  });
}

    if (cropResults.length === 0) {
      return res.status(502).json({
        message:
          "Predicted crops are not available in crop master data",
      });
    }

    const existingRecommendation = await Recommendation.findOne({
      fieldId,
      soilTestId: latestSoilTest._id,
      modelVersion: ML_MODEL_VERSION,
      "environmentalSnapshot.temperature": weather.temperature,
      "environmentalSnapshot.humidity": weather.humidity,
      "environmentalSnapshot.rainfall": weather.rainfall,
    }).sort({ createdAt: -1 });

    if (existingRecommendation) {
      return res.status(200).json({
        message: "Recommendation already exists for these inputs",
        weather: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          rainfall: weather.rainfall,
        },
        prediction,
        recommendation: existingRecommendation,
      });
    }

    const recommendation = await Recommendation.create({
      fieldId,
      soilTestId: latestSoilTest._id,

      environmentalSnapshot: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
      },

      modelVersion: ML_MODEL_VERSION,
      results: cropResults,
      selectedCropId: null,
    });

    return res.status(201).json({
      message: "Crop recommendation generated successfully",

      dataQuality: {
        soilTestId: latestSoilTest._id,
        soilTestDate: latestSoilTest.testedAt,
        soilTestSource: latestSoilTest.source,
        weatherSource: "weather-service",
        modelVersion: ML_MODEL_VERSION,
      },

      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
      },

      prediction,

      recommendation,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    return res.status(500).json({
      message: "Failed to generate crop recommendation",
      error: error.message,
    });
  }
};

export const selectRecommendedCrop = async (
  req,
  res
) => {
  try {
    const { recommendationId } =
      req.params;
    const { cropId } = req.body;

    if (!isValidObjectId(recommendationId)) {
      return res.status(400).json({
        message:
          "Invalid recommendation ID",
      });
    }

    if (!cropId) {
      return res.status(400).json({
        message: "cropId is required",
      });
    }

    if (!isValidObjectId(cropId)) {
      return res.status(400).json({
        message: "Invalid crop ID",
      });
    }

    const recommendation =
      await Recommendation.findById(
        recommendationId
      );

    if (!recommendation) {
      return res.status(404).json({
        message:
          "Recommendation not found",
      });
    }

    const isRecommended =
      Array.isArray(
        recommendation.results
      ) &&
      recommendation.results.some(
        (result) =>
          result?.cropId &&
          result.cropId.toString() ===
            cropId.toString()
      );

    if (!isRecommended) {
      return res.status(400).json({
        message:
          "Selected crop is not in the recommendations",
      });
    }

    const selectedCrop =
      await Crop.findById(cropId);

    if (!selectedCrop) {
      return res.status(404).json({
        message:
          "Selected crop not found",
      });
    }

    const lifecycleReady =
      selectedCrop.durationDays?.min !=
        null &&
      selectedCrop.durationDays?.max !=
        null &&
      Array.isArray(
        selectedCrop.growthStages
      ) &&
      selectedCrop.growthStages.length >
        0;

    if (!lifecycleReady) {
      return res.status(400).json({
        message:
          "Selected crop is not configured for crop lifecycle tracking",
      });
    }
    
    const field = await Field.findOne({
      _id: recommendation.fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to modify this recommendation",
      });
    }

    recommendation.selectedCropId =
      cropId;

    recommendation.selectedAt =
      new Date();

    await recommendation.save();

    return res.status(200).json({
      message:
        "Crop selected successfully",
      recommendation,
    });
  } catch (error) {
    console.error(
      "Select crop error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to select crop",
      error: error.message,
    });
  }
};