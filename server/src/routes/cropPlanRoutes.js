import express from "express";
import { createCropPlan } from "../controllers/cropPlanController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/crop-cycles/:cropCycleId/plan",
  protect,
  createCropPlan
);

export default router;