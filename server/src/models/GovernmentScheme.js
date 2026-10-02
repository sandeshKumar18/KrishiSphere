import mongoose from "mongoose";

const governmentSchemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    level: {
      type: String,
      enum: ["Central", "State"],
      required: true,
    },

    state: {
      type: String,
      default: "All India",
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    benefits: {
      type: [String],
      default: [],
    },

    eligibility: {
      type: [String],
      default: [],
    },

    documents: {
      type: [String],
      default: [],
    },

    applicationSteps: {
      type: [String],
      default: [],
    },

    officialPortal: {
      type: String,
      required: true,
      trim: true,
    },

    officialSource: {
      type: String,
      required: true,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    // Information specifically prepared for the AI assistant.
    aiContext: {
      type: String,
      default: "",
    },

    
    lastVerifiedAt: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
governmentSchemeSchema.index({
  name: "text",
  shortDescription: "text",
  category: "text",
  tags: "text",
});

governmentSchemeSchema.index({
  state: 1,
  isActive: 1,
});

governmentSchemeSchema.index({
  category: 1,
  isActive: 1,
});

const GovernmentScheme = mongoose.model(
  "GovernmentScheme",
  governmentSchemeSchema
);

export default GovernmentScheme;