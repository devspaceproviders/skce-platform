import { Router } from "express";

import {
  getAdminCourseContentController,
  createModuleController,
  updateModuleController,
  deleteModuleController,
  createLessonController,
  updateLessonController,
  deleteLessonController,
  reorderModuleController,
  reorderLessonController,
} from "../controllers/course-content-admin.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

router.use(
  authenticate,
  requireRole("ADMIN")
);

/* =========================================================
   GET COURSE CONTENT
========================================================= */

router.get(
  "/:courseId",
  getAdminCourseContentController
);

/* =========================================================
   MODULES
========================================================= */

/*
 * Create module
 */
router.post(
  "/:courseId/modules",
  createModuleController
);

/*
 * Update module
 */
router.patch(
  "/modules/:moduleId",
  updateModuleController
);

/*
 * Delete module
 */
router.delete(
  "/modules/:moduleId",
  deleteModuleController
);

/*
 * Reorder module
 *
 * Body:
 * {
 *   "direction": "UP"
 * }
 *
 * or
 *
 * {
 *   "direction": "DOWN"
 * }
 */
router.patch(
  "/modules/:moduleId/reorder",
  reorderModuleController
);

/* =========================================================
   LESSONS
========================================================= */

/*
 * Create lesson
 */
router.post(
  "/modules/:moduleId/lessons",
  createLessonController
);

/*
 * Update lesson
 */
router.patch(
  "/lessons/:lessonId",
  updateLessonController
);

/*
 * Delete lesson
 */
router.delete(
  "/lessons/:lessonId",
  deleteLessonController
);

/*
 * Reorder lesson
 *
 * Body:
 * {
 *   "direction": "UP"
 * }
 *
 * or
 *
 * {
 *   "direction": "DOWN"
 * }
 */
router.patch(
  "/lessons/:lessonId/reorder",
  reorderLessonController
);

export default router;