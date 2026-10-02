import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createField,
  getFields,
  getFieldById,
  updateField,
  deleteField,
  getFieldWeather,
  getFieldDeletePreview,
} from "../controllers/fieldController.js";


const router = express.Router();

router.use(protect);

router.post("/",protect, createField);
router.get("/", protect,getFields);
router.get("/:fieldId", protect,getFieldById);
router.patch("/:fieldId",protect, updateField);
router.delete("/:fieldId",protect, deleteField);
router.get("/:fieldId/weather",protect, getFieldWeather);
router.get("/:fieldId/delete-preview",protect,getFieldDeletePreview);

export default router;