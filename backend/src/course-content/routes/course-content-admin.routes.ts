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
  uploadLessonImageController,
  uploadModuleImageController,
} from "../controllers/course-content-admin.controller";

import {
  courseVideoUpload,
  courseDocumentUpload,
  lessonImageUpload,
  moduleImageUpload,
} from "../middleware/course-content-upload";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/* =========================================================
   AUTHENTICATION & ROLE
========================================================= */

router.use(
  authenticate,
  requireRole("ADMIN", "TRAINER")
);

/* =========================================================
   COURSE CONTENT
========================================================= */

router.get(
  "/:courseId",
  getAdminCourseContentController
);

/* =========================================================
   MODULES
========================================================= */

router.post(
  "/:courseId/modules",
  createModuleController
);

router.patch(
  "/modules/:moduleId",
  updateModuleController
);

router.delete(
  "/modules/:moduleId",
  deleteModuleController
);

router.patch(
  "/modules/:moduleId/reorder",
  reorderModuleController
);

/* =========================================================
   MODULE IMAGE
========================================================= */

router.post(
  "/modules/:moduleId/image",
  moduleImageUpload.single("image"),
  uploadModuleImageController
);

/* =========================================================
   LESSONS
========================================================= */

router.post(
  "/modules/:moduleId/lessons",
  createLessonController
);

router.patch(
  "/lessons/:lessonId",
  updateLessonController
);

router.delete(
  "/lessons/:lessonId",
  deleteLessonController
);

router.patch(
  "/lessons/:lessonId/reorder",
  reorderLessonController
);

/* =========================================================
   LESSON VIDEO
========================================================= */

router.post(
  "/lessons/:lessonId/video",
  courseVideoUpload.single("video"),
  uploadLessonVideoController
);

/* =========================================================
   LESSON DOCUMENT
========================================================= */

router.post(
  "/lessons/:lessonId/document",
  courseDocumentUpload.single("document"),
  uploadLessonDocumentController
);

/* =========================================================
   LESSON IMAGE
   Temporary - kept until Lesson.imageUrl is removed
========================================================= */

router.post(
  "/lessons/:lessonId/image",
  lessonImageUpload.single("image"),
  uploadLessonImageController
);

export default router;