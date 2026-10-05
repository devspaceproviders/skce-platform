import { Router } from "express";

import {
  getCourse,
  getCourses,
  getAdminCourses,
  getAdminCourse,
  createCourseController,
  updateCourseController,
  deleteCourseController,
  uploadCourseImageController,
} from "../controllers/course.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  courseImageUpload,
} from "../middleware/course-image.upload";

const router = Router();

/*
 * ============================================================
 * PUBLIC ROUTES
 * ============================================================
 */

router.get("/", getCourses);

router.get("/:slug", getCourse);

/*
 * ============================================================
 * ADMIN ROUTES
 *
 * These are kept separate under /api/admin/courses
 * in server.ts.
 * ============================================================
 */

export const adminCourseRouter = Router();

adminCourseRouter.use(
  authenticate,
  requireRole("ADMIN")
);

adminCourseRouter.get(
  "/",
  getAdminCourses
);

adminCourseRouter.get(
  "/:id",
  getAdminCourse
);

adminCourseRouter.post(
  "/",
  createCourseController
);

adminCourseRouter.patch(
  "/:id",
  updateCourseController
);

adminCourseRouter.delete(
  "/:id",
  deleteCourseController
);

/*
 * ============================================================
 * ADMIN COURSE IMAGE
 * ============================================================
 *
 * POST /api/admin/courses/:id/image
 *
 * Content-Type:
 * multipart/form-data
 *
 * Field name:
 * image
 *
 * ============================================================
 */

adminCourseRouter.post(
  "/:id/image",
  courseImageUpload.single("image"),
  uploadCourseImageController
);

export default router;