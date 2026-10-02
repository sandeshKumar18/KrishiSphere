import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createSoilTest,
  getSoilTests,
  getLatestSoilTest,
} from "../controllers/soilTestController.js";

const router = express.Router();

router.use(protect);

router.post("/:fieldId/soil-tests",protect, createSoilTest);
router.get("/:fieldId/soil-tests", protect, getSoilTests);
router.get("/:fieldId/soil-tests/latest",protect, getLatestSoilTest);

export default router;