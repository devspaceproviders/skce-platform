import { Router } from "express";

import {
  getStudents,
  getStudent,
  getMyDashboard,
} from "../controllers/student.controller";

import { authenticate } from "../../auth/middleware/auth.middleware";
import { requireRole } from "../../auth/middleware/role.middleware";

const router = Router();

/*
 * ==========================================================
 * ADMIN / GENERAL STUDENT MANAGEMENT
 * ==========================================================
 *
 * These routes are currently protected.
 *
 * Only ADMIN users should be able to retrieve the complete
 * student list or another student's profile.
 */

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  getStudents
);

router.get(
  "/:studentId",
  authenticate,
  requireRole("ADMIN"),
  getStudent
);

/*
 * ==========================================================
 * LOGGED-IN STUDENT DASHBOARD
 * ==========================================================
 *
 * The student is identified from the JWT.
 *
 * We do NOT accept a student ID from the frontend here.
 */

router.get(
  "/me/dashboard",
  authenticate,
  requireRole("STUDENT"),
  getMyDashboard
);

export default router;