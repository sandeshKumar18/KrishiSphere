
import express from "express";
import protect from "../middleware/authMiddleware.js";


import {
  getCrops,
  getCropById,
} from "../controllers/cropController.js";

const router = express.Router();

router.get("/", protect, getCrops);
router.get("/:cropId", protect,getCropById);

export default router;