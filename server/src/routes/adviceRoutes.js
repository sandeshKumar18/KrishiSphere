import express from "express";

import { getCropAdvice } from "../controllers/adviceController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/crop-cycles/:cropCycleId/advice",
  protect,
  getCropAdvice
);

export default router;