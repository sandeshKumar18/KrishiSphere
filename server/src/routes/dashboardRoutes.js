import express from "express";

import {
  getCropCycleDashboard,
} from "../controllers/dashboardController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/crop-cycles/:cropCycleId/dashboard",
  protect,
  getCropCycleDashboard
);

export default router;