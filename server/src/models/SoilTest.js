import mongoose from "mongoose";

const finiteNumberValidator = {
  validator: Number.isFinite,
  message: "Value must be a finite number",
};

const soilTestSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
      index: true,
    },

    testedAt: {
      type: Date,
      required: true,
    },

    nitrogen: {
      type: Number,
      required: true,
      min: 0,
      validate: finiteNumberValidator,
    },

    phosphorus: {
      type: Number,
      required: true,
      min: 0,
      validate: finiteNumberValidator,
    },

    potassium: {
      type: Number,
      required: true,
      min: 0,
      validate: finiteNumberValidator,
    },

    pH: {
      type: Number,
      required: true,
      min: 0,
      max: 14,
      validate: finiteNumberValidator,
    },

    moisture: {
      type: Number,
      min: 0,
      max: 100,
      validate: finiteNumberValidator,
    },

    source: {
      type: String,
      enum: ["manual", "lab", "sensor"],
      default: "manual",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

soilTestSchema.index({
  fieldId: 1,
  testedAt: -1,
});

export default mongoose.model(
  "SoilTest",
  soilTestSchema
);