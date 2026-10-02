import GovernmentScheme from "../models/GovernmentScheme.js";
import {
  generateSchemeAdvice,
} from "../services/adviceService.js";

export const getGovernmentSchemes = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      state = "",
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (search.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    if (category.trim()) {
      filter.category = category.trim();
    }

    if (state.trim()) {
      filter.$or = [
        {
          state: state.trim(),
        },
        {
          state: "All India",
        },
      ];
    }

    const schemes = await GovernmentScheme.find(filter)
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: schemes.length,
      schemes,
    });
  } catch (error) {
    console.error("Get government schemes error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch government schemes",
    });
  }
};


export const getGovernmentSchemeBySlug = async (
  req,
  res
) => {
  try {
    const { slug } = req.params;

    const scheme = await GovernmentScheme.findOne({
      slug,
      isActive: true,
    }).lean();

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: "Government scheme not found",
      });
    }

    res.status(200).json({
      success: true,
      scheme,
    });
  } catch (error) {
    console.error(
      "Get government scheme error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch government scheme",
    });
  }
};


export const askGovernmentSchemeAI = async (
  req,
  res
) => {
  try {
    const {
      question,
      conversationHistory = [],
    } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const safeHistory = Array.isArray(
      conversationHistory
    )
      ? conversationHistory
          .filter(
            (message) =>
              message &&
              typeof message.content === "string" &&
              (message.role === "user" ||
                message.role === "assistant")
          )
          .slice(-10)
      : [];

    const schemes = await GovernmentScheme.find({
      isActive: true,
    })
      .select(
        [
          "name",
          "slug",
          "level",
          "state",
          "category",
          "department",
          "shortDescription",
          "benefits",
          "eligibility",
          "documents",
          "applicationSteps",
          "officialPortal",
          "officialSource",
          "tags",
          "lastVerifiedAt",
        ].join(" ")
      )
      .lean();

    if (!schemes.length) {
      return res.status(404).json({
        success: false,
        message:
          "No government scheme information is currently available",
      });
    }

    const answer = await generateSchemeAdvice(
      schemes,
      question.trim(),
      safeHistory
    );

    res.status(200).json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(
      "Government scheme AI error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to get government scheme assistance",
    });
  }
};
