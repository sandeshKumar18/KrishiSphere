import Crop from "../models/Crop.js";

export const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find({})
      .select(
        "name scientificName description durationDays seasons environmentalRequirements growthStages"
      )
      .sort({ name: 1 });

    res.status(200).json({
      message: "Crops fetched successfully",
      crops,
    });
  } catch (error) {
    console.error("Get crops error:", error);

    res.status(500).json({
      message: "Unable to fetch crops",
    });
  }
};

export const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.cropId);

    if (!crop) {
      return res.status(404).json({
        message: "Crop not found",
      });
    }

    res.status(200).json({
      message: "Crop fetched successfully",
      crop,
    });
  } catch (error) {
    console.error("Get crop error:", error);

    res.status(500).json({
      message: "Unable to fetch crop",
    });
  }
};