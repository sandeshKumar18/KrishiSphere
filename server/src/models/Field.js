import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    area: {
      type: Number,
      required: true,
      min: 0.01,

      validate: {
        validator: Number.isFinite,
        message: "Area must be a finite number",
      },
    },

    areaUnit: {
      type: String,
      enum: ["acre", "hectare", "bigha"],
      default: "acre",
    },

    location: {
      state: {
        type: String,
        required: true,
        trim: true,
      },

      district: {
        type: String,
        required: true,
        trim: true,
      },
    },

    soilType: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Field", fieldSchema);