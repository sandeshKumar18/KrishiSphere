import express from "express";
import protect from "../middleware/authMiddleware.js";

import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/profile",protect,updateProfile);
router.patch("/password",protect,changePassword);

export default router;