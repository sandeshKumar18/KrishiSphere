import express from "express";

import {
  getGovernmentSchemes,
  getGovernmentSchemeBySlug,
  askGovernmentSchemeAI,
} from "../controllers/governmentSchemeController.js";

import protect from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/ai",protect, askGovernmentSchemeAI);

router.get("/", protect,getGovernmentSchemes);

router.get("/:slug",protect, getGovernmentSchemeBySlug);

export default router;
