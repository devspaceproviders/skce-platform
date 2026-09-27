import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  getMyTrainerCoursePermissions,
} from "../controllers/trainer-course-permission-trainer.controller";

const router = Router();

router.use(
  authenticate,
  requireRole("TRAINER")
);

router.get(
  "/",
  getMyTrainerCoursePermissions
);

export default router;