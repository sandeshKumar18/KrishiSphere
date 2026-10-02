import mongoose from "mongoose";

import SoilTest from "../models/SoilTest.js";
import Recommendation from "../models/Recommendation.js";
import CropCycle from "../models/CropCycle.js";
import CropPlan from "../models/CropPlan.js";
import Field from "../models/Field.js";
import Task from "../models/Task.js";
import { getWeatherForLocation } from "../services/weatherService.js";

const isValidString = (value) =>
  typeof value === "string" &&
  value.trim().length > 0;

const isValidPositiveNumber = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0;

const isValidationError = (error) =>
  error?.name === "ValidationError" ||
  error?.name === "CastError";

export const createField = async (req, res) => {
  try {
    const {
      name,
      area,
      areaUnit,
      location,
      soilType,
    } = req.body;

    if (!isValidString(name)) {
      return res.status(400).json({
        success: false,
        message: "Field name is required",
      });
    }

    if (!isValidPositiveNumber(area)) {
      return res.status(400).json({
        success: false,
        message: "Area must be a valid number greater than 0",
      });
    }

    if (
      !location ||
      !isValidString(location.state) ||
      !isValidString(location.district)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid state and district are required",
      });
    }

    if (
      areaUnit !== undefined &&
      !["acre", "hectare", "bigha"].includes(areaUnit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid area unit",
      });
    }

    if (
      soilType !== undefined &&
      soilType !== null &&
      typeof soilType !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Soil type must be text",
      });
    }

    const field = await Field.create({
      farmerId: req.user._id,
      name: name.trim(),
      area,
      areaUnit: areaUnit || "acre",
      location: {
        state: location.state.trim(),
        district: location.district.trim(),
      },
      soilType:
        typeof soilType === "string"
          ? soilType.trim()
          : soilType,
    });

    return res.status(201).json({
      success: true,
      message: "Field created successfully",
      data: {
        field,
      },
    });
  } catch (error) {
    console.error("Create field error:", error);

    if (isValidationError(error)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getFields = async (req, res) => {
  try {
    const fields = await Field.find({
      farmerId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        fields,
      },
    });
  } catch (error) {
    console.error("Get fields error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getFieldById = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field ID",
      });
    }

    const field = await Field.findOne({
      _id: fieldId,
      farmerId: req.user._id,
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: "Field not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        field,
      },
    });
  } catch (error) {
    console.error("Get field error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateField = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field ID",
      });
    }

    const allowedUpdates = [
      "name",
      "area",
      "areaUnit",
      "location",
      "soilType",
    ];

    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (
      updates.name !== undefined &&
      !isValidString(updates.name)
    ) {
      return res.status(400).json({
        success: false,
        message: "Field name cannot be empty",
      });
    }

    if (
      updates.area !== undefined &&
      !isValidPositiveNumber(updates.area)
    ) {
      return res.status(400).json({
        success: false,
        message: "Area must be a valid number greater than 0",
      });
    }

    if (
      updates.areaUnit !== undefined &&
      !["acre", "hectare", "bigha"].includes(
        updates.areaUnit
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid area unit",
      });
    }

    if (updates.location !== undefined) {
      if (
        !updates.location ||
        typeof updates.location !== "object" ||
        !isValidString(updates.location.state) ||
        !isValidString(updates.location.district)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Location must contain valid state and district",
        });
      }

      updates.location = {
        state: updates.location.state.trim(),
        district:
          updates.location.district.trim(),
      };
    }

    if (
      updates.soilType !== undefined &&
      updates.soilType !== null &&
      typeof updates.soilType !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Soil type must be text",
      });
    }

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
    }

    if (typeof updates.soilType === "string") {
      updates.soilType = updates.soilType.trim();
    }

    const field = await Field.findOneAndUpdate(
      {
        _id: fieldId,
        farmerId: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!field) {
      return res.status(404).json({
        success: false,
        message: "Field not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Field updated successfully",
      data: {
        field,
      },
    });
  } catch (error) {
    console.error("Update field error:", error);

    if (isValidationError(error)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const forceDelete =
      req.query.force === "true";

    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        message: "Invalid field ID.",
      });
    }

    const field = await Field.findById(fieldId);

    if (!field) {
      return res.status(404).json({
        message: "Field not found.",
      });
    }

    if (
      field.farmerId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to delete this field.",
      });
    }

    const [
      soilTestCount,
      recommendationCount,
      cropCycleCount,
    ] = await Promise.all([
      SoilTest.countDocuments({
        fieldId,
      }),

      Recommendation.countDocuments({
        fieldId,
      }),

      CropCycle.countDocuments({
        fieldId,
      }),
    ]);

    const hasDependencies =
      soilTestCount > 0 ||
      recommendationCount > 0 ||
      cropCycleCount > 0;

   
    if (hasDependencies && !forceDelete) {
      return res.status(409).json({
        message:
          "This field contains existing data.",
        dependencies: {
          soilTests: soilTestCount,
          recommendations:
            recommendationCount,
          cropCycles: cropCycleCount,
        },
      });
    }

    
    if (forceDelete && cropCycleCount > 0) {
      const cropCycleIds =
        await CropCycle.find({
          fieldId,
        }).distinct("_id");

      await Promise.all([
        Task.deleteMany({
          cropCycleId: {
            $in: cropCycleIds,
          },
        }),

        CropPlan.deleteMany({
          cropCycleId: {
            $in: cropCycleIds,
          },
        }),
      ]);
    }

    await Promise.all([
      SoilTest.deleteMany({
        fieldId,
      }),

      Recommendation.deleteMany({
        fieldId,
      }),

      CropCycle.deleteMany({
        fieldId,
      }),
    ]);

    await Field.findByIdAndDelete(fieldId);

    return res.status(200).json({
      message:
        "Field and related data deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE FIELD ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to delete field.",
    });
  }
};

export const getFieldWeather = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
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

    const weather = await getWeatherForLocation({
      state: field.location.state,
      district: field.location.district,
    });

    if (
      !weather ||
      !Number.isFinite(weather.temperature) ||
      !Number.isFinite(weather.humidity) ||
      !Number.isFinite(weather.rainfall)
    ) {
      return res.status(502).json({
        message: "Weather service returned invalid data",
      });
    }

    return res.status(200).json({
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
      },
    });
  } catch (error) {
    console.error("FIELD WEATHER ERROR:", error);

    return res.status(502).json({
      message: "Unable to retrieve weather data",
      error: error.message,
    });
  }
};

export const getFieldDeletePreview = async (req, res) => {
  try {
    const { fieldId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        message: "Invalid field ID.",
      });
    }

    const field = await Field.findOne({
      _id: fieldId,
      farmerId: req.user._id,
    }).lean();

    if (!field) {
      return res.status(404).json({
        message: "Field not found.",
      });
    }

    const [
      soilTestCount,
      recommendationCount,
      cropCycleCount,
    ] = await Promise.all([
      SoilTest.countDocuments({
        fieldId,
      }),

      Recommendation.countDocuments({
        fieldId,
      }),

      CropCycle.countDocuments({
        fieldId,
      }),
    ]);

    const hasData =
      soilTestCount > 0 ||
      recommendationCount > 0 ||
      cropCycleCount > 0;

    return res.status(200).json({
      hasData,
      dependencies: {
        soilTests: soilTestCount,
        recommendations: recommendationCount,
        cropCycles: cropCycleCount,
      },
    });
  } catch (error) {
    console.error(
      "FIELD DELETE PREVIEW ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to check field data.",
    });
  }
};