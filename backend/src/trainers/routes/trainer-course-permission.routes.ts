import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  createPermission,
  deletePermission,
  getPermission,
  listPermissions,
  updatePermission,
} from "../controllers/trainer-course-permission.controller";

const router = Router();

/*
 * ============================================================
 * ADMIN TRAINER COURSE PERMISSIONS
 * ============================================================
 *
 * All permission-management endpoints are ADMIN-only.
 *
 * GET    /api/admin/trainer-course-permissions
 * GET    /api/admin/trainer-course-permissions/:trainerId/:courseId
 * POST   /api/admin/trainer-course-permissions
 * PATCH  /api/admin/trainer-course-permissions/:trainerId/:courseId
 * DELETE /api/admin/trainer-course-permissions/:trainerId/:courseId
 *
 * ============================================================
 */

router.use(
  authenticate,
  requireRole("ADMIN")
);

router.get(
  "/",
  listPermissions
);

router.get(
  "/:trainerId/:courseId",
  getPermission
);

router.post(
  "/",
  createPermission
);

router.patch(
  "/:trainerId/:courseId",
  updatePermission
);

router.delete(
  "/:trainerId/:courseId",
  deletePermission
);

export default router;