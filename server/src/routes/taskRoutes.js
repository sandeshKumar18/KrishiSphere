import express from "express";

import {
  createTask,
  getCropCycleTasks,
  updateTaskStatus,
  generateCurrentStageTask,
} from "../controllers/taskController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/crop-cycles/:cropCycleId/tasks",
  protect,
  createTask
);

router.get(
  "/crop-cycles/:cropCycleId/tasks",
  protect,
  getCropCycleTasks
);

router.patch(
  "/tasks/:taskId/status",
  protect,
  updateTaskStatus
);


router.post(
  "/crop-cycles/:cropCycleId/tasks/generate-current",
  protect,
  generateCurrentStageTask
);

export default router;