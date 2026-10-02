import mongoose from "mongoose";

import Field from "../models/Field.js";
import SoilTest from "../models/SoilTest.js";

const isFiniteNumber = (value) =>
  typeof value === "number" &&
  Number.isFinite(value);

const isValidationError = (error) =>
  error?.name === "ValidationError" ||
  error?.name === "CastError";

export const createSoilTest = async (req, res) => {
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

    const {
      testedAt,
      nitrogen,
      phosphorus,
      potassium,
      pH,
      moisture,
      source,
      notes,
    } = req.body;

    if (!testedAt) {
      return res.status(400).json({
        success: false,
        message: "Soil test date is required",
      });
    }

    const parsedTestDate = new Date(testedAt);

    if (
      Number.isNaN(
        parsedTestDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid soil test date",
      });
    }

    if (
      !isFiniteNumber(nitrogen) ||
      nitrogen < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Nitrogen must be a valid number greater than or equal to 0",
      });
    }

    if (
      !isFiniteNumber(phosphorus) ||
      phosphorus < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phosphorus must be a valid number greater than or equal to 0",
      });
    }

    if (
      !isFiniteNumber(potassium) ||
      potassium < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Potassium must be a valid number greater than or equal to 0",
      });
    }

    if (
      !isFiniteNumber(pH) ||
      pH < 0 ||
      pH > 14
    ) {
      return res.status(400).json({
        success: false,
        message:
          "pH must be a valid number between 0 and 14",
      });
    }

    if (
      moisture !== undefined &&
      moisture !== null &&
      (
        !isFiniteNumber(moisture) ||
        moisture < 0 ||
        moisture > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Moisture must be a valid number between 0 and 100",
      });
    }

    if (
      source !== undefined &&
      !["manual", "lab", "sensor"].includes(source)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid soil test source",
      });
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Notes must be text",
      });
    }

    const soilTest = await SoilTest.create({
      fieldId,
      testedAt: parsedTestDate,
      nitrogen,
      phosphorus,
      potassium,
      pH,
      moisture,
      source: source || "manual",
      notes:
        typeof notes === "string"
          ? notes.trim()
          : notes,
    });

    return res.status(201).json({
      success: true,
      message: "Soil test added successfully",
      data: {
        soilTest,
      },
    });
  } catch (error) {
    console.error(
      "Create soil test error:",
      error
    );

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

export const getSoilTests = async (req, res) => {
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

    const soilTests = await SoilTest.find({
      fieldId,
    }).sort({
      testedAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: {
        soilTests,
      },
    });
  } catch (error) {
    console.error(
      "Get soil tests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getLatestSoilTest = async (req, res) => {
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

    const latestSoilTest = await SoilTest.findOne({
      fieldId,
    }).sort({
      testedAt: -1,
    });

    
    if (!latestSoilTest) {
      return res.status(200).json({
        success: true,
        soilTest: null,
        message: "No soil test found for this field",
      });
    }

    return res.status(200).json({
      success: true,
      soilTest: latestSoilTest,
    });
  } catch (error) {
    console.error(
      "GET LATEST SOIL TEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch latest soil test",
      error: error.message,
    });
  }
};