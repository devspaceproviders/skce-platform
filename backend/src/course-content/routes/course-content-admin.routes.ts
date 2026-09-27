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
  uploadLessonVideoController,
  uploadLessonDocumentController,
} from "../controllers/course-content-admin.controller";

import {
  courseVideoUpload,
  courseDocumentUpload,
} from "../middleware/course-content-upload";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/* =========================================================
   ADMIN / TRAINER AUTHENTICATION
========================================================= */

router.use(
  authenticate,
  requireRole("ADMIN", "TRAINER")
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

/* =========================================================
   LESSON VIDEO UPLOAD
========================================================= */

/*
 * Multipart field:
 * video
 *
 * POST
 * /api/admin/course-content/lessons/:lessonId/video
 */
router.post(
  "/lessons/:lessonId/video",
  courseVideoUpload.single("video"),
  uploadLessonVideoController
);

/* =========================================================
   LESSON DOCUMENT UPLOAD
========================================================= */

/*
 * Multipart field:
 * document
 *
 * POST
 * /api/admin/course-content/lessons/:lessonId/document
 */
router.post(
  "/lessons/:lessonId/document",
  courseDocumentUpload.single("document"),
  uploadLessonDocumentController
);

export default router;