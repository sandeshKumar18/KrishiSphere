import express from "express";

import {
  getCropCycleDashboard,
  getCropCycleDashboardSupplementary,
} from "../controllers/dashboardController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/crop-cycles/:cropCycleId/dashboard",
  protect,
  getCropCycleDashboard
);

router.get(
  "/crop-cycles/:cropCycleId/dashboard/supplementary",
  protect,
  getCropCycleDashboardSupplementary
);
export default router;