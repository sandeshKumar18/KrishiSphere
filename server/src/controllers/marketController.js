import mongoose from "mongoose";

import Field from "../models/Field.js";
import CropCycle from "../models/CropCycle.js";
import { getMarketPrices } from "../services/marketService.js";

export const getCropCycleMarketPrices = async (
  req,
  res
) => {
  try {
    const { cropCycleId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        cropCycleId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid crop cycle ID",
      });
    }

    const cropCycle =
      await CropCycle.findById(
        cropCycleId
      ).populate(
        "cropId",
        "name scientificName"
      );

    if (!cropCycle) {
      return res.status(404).json({
        message:
          "Crop cycle not found",
      });
    }

    const field =
      await Field.findOne({
        _id: cropCycle.fieldId,
        farmerId: req.user._id,
      });

    if (!field) {
      return res.status(403).json({
        message:
          "You are not authorized to access this crop cycle",
      });
    }

    if (!cropCycle.cropId) {
      return res.status(404).json({
        message:
          "Crop information not found",
      });
    }

    const commodity =
      cropCycle.cropId.name?.trim();

    if (!commodity) {
      return res.status(400).json({
        message:
          "Crop name is required for market lookup",
      });
    }

    let marketData;

    try {
      marketData =
        await getMarketPrices({
          state:
            field.location?.state,
          district:
            field.location?.district,
          commodity,
        });
    } catch (error) {
      console.error(
        "Market provider error:",
        error
      );

      return res.status(502).json({
        message:
          "Market data is temporarily unavailable.",
        error: error.message,
        crop: cropCycle.cropId,
        location: {
          state:
            field.location?.state ||
            null,
          district:
            field.location?.district ||
            null,
        },
      });
    }

    if (
      !marketData ||
      !Array.isArray(
        marketData.records
      )
    ) {
      return res.status(502).json({
        message:
          "Market provider returned an invalid response.",
      });
    }

    if (
      marketData.records.length ===
      0
    ) {
      return res.status(200).json({
        message:
          "No market data available for this crop.",
        crop:
          cropCycle.cropId,
        location: {
          state:
            field.location?.state ||
            null,
          district:
            field.location?.district ||
            null,
        },
        ...marketData,
      });
    }

    return res.status(200).json({
      message:
        "Market data fetched successfully",
      crop:
        cropCycle.cropId,
      location: {
        state:
          field.location?.state ||
          null,
        district:
          field.location?.district ||
          null,
      },
      ...marketData,
    });
  } catch (error) {
    console.error(
      "Crop cycle market error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch market data",
      error: error.message,
    });
  }
};