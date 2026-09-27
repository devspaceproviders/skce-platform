import { Router } from "express";

import {
  getCourse,
  getCourses,
  getAdminCourses,
  getAdminCourse,
  createCourseController,
  updateCourseController,
  deleteCourseController,
} from "../controllers/course.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

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

export default router;