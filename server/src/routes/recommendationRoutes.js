import express from "express";
import { createRecommendation,
    selectRecommendedCrop
 } from "../controllers/recommendationController.js";
import  protect  from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/fields/:fieldId/recommendations",
  protect,
  createRecommendation
);

router.patch(
  "/recommendations/:recommendationId/select",
  protect,
  selectRecommendedCrop
);

export default router;