import { Router } from "express";

import {
  startLessonController,
  completeLessonController,
  getCourseProgressController,
} from "../controllers/course-progress.controller";

import { authenticate } from "../../auth/middleware/auth.middleware";
import { requireRole } from "../../auth/middleware/role.middleware";

const router = Router();


// Start lesson
router.post(
  "/lessons/:lessonId/start",
  authenticate,
  requireRole("STUDENT"),
  startLessonController
);


// Complete lesson
router.post(
  "/lessons/:lessonId/complete",
  authenticate,
  requireRole("STUDENT"),
  completeLessonController
);


// Get course progress
router.get(
  "/courses/:courseId/progress",
  authenticate,
  requireRole("STUDENT"),
  getCourseProgressController
);


export default router;