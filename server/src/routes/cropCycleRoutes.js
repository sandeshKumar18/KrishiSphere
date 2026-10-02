import express from "express";
import {
  createCropCycle,
  getFieldCropCycles,
  updateCropCycleStage,
  updateCropCycleStatus,
  getCropCycleProgress,
  getAllCropCycles,
} from "../controllers/cropCycleController.js";

import {
  getCropCycleDashboardSupplementary,
} from "../controllers/dashboardController.js";

import {
  getFarmDashboardSummary,
} from "../controllers/dashboardController.js";



import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/recommendations/:recommendationId/crop-cycle",
  protect,
  createCropCycle
);

router.get(
  "/fields/:fieldId/crop-cycles",
  protect,
  getFieldCropCycles
);

router.patch(
  "/crop-cycles/:cropCycleId/stage",
  protect,
  updateCropCycleStage
);

router.patch(
  "/crop-cycles/:cropCycleId/status",
  protect,
  updateCropCycleStatus
);

router.get(
  "/crop-cycles/:cropCycleId/progress",
  protect,
  getCropCycleProgress
);

router.get(
  "/dashboard/farm",
  protect,
  getFarmDashboardSummary
);

router.get(
  "/crop-cycles",
  protect,
  getAllCropCycles
);

router.get(
  "/crop-cycles/:cropCycleId/dashboard/supplementary",
  protect,
  getCropCycleDashboardSupplementary
);

export default router;