import express from "express";

import {
  getCropCycleMarketPrices,
} from "../controllers/marketController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/crop-cycles/:cropCycleId/market",
  protect,
  getCropCycleMarketPrices
);

export default router;