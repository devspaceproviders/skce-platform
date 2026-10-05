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
} from "../controllers/course-content-admin.controller";

import {
  courseVideoUpload,
  courseDocumentUpload,
  lessonImageUpload,
} from "../middleware/course-content-upload";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

const router = Router();

router.use(
  authenticate,
  requireRole("ADMIN", "TRAINER")
);

router.get(
  "/:courseId",
  getAdminCourseContentController
);

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

router.post(
  "/lessons/:lessonId/video",
  courseVideoUpload.single("video"),
  uploadLessonVideoController
);

router.post(
  "/lessons/:lessonId/document",
  courseDocumentUpload.single("document"),
  uploadLessonDocumentController
);

router.post(
  "/lessons/:lessonId/image",
  lessonImageUpload.single("image"),
  uploadLessonImageController
);

export default router;
