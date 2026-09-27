import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  createAdminTrainerController,
  getAdminTrainerController,
  listAdminTrainersController,
  listPublicTrainersController,
  resetAdminTrainerPasswordController,
  updateAdminTrainerController,
  updateAdminTrainerPhotoController,
} from "../controllers/trainer.controller";

import {
  profilePhotoUpload,
} from "../../profile/profile-photo.upload";

/*
 * ============================================================
 * PUBLIC TRAINER ROUTES
 * ============================================================
 *
 * GET /api/trainers
 *
 * No authentication required.
 *
 * Used by the public Trainers page.
 *
 * ============================================================
 */

export const publicTrainerRouter =
  Router();

publicTrainerRouter.get(
  "/",
  listPublicTrainersController
);

/*
 * ============================================================
 * ADMIN TRAINER ROUTES
 * ============================================================
 *
 * GET    /api/admin/trainers
 * GET    /api/admin/trainers/:id
 * POST   /api/admin/trainers
 * PATCH  /api/admin/trainers/:id
 * POST   /api/admin/trainers/:id/photo
 * POST   /api/admin/trainers/:id/reset-password
 *
 * ============================================================
 */

const trainerAdminRouter =
  Router();

trainerAdminRouter.use(
  authenticate,
  requireRole("ADMIN")
);

trainerAdminRouter.get(
  "/",
  listAdminTrainersController
);

trainerAdminRouter.get(
  "/:id",
  getAdminTrainerController
);

trainerAdminRouter.post(
  "/",
  createAdminTrainerController
);

trainerAdminRouter.patch(
  "/:id",
  updateAdminTrainerController
);

/*
 * ============================================================
 * TRAINER PROFILE PHOTO
 * ============================================================
 *
 * POST /api/admin/trainers/:id/photo
 *
 * Admin can update a trainer's profile photo.
 *
 * ============================================================
 */

trainerAdminRouter.post(
  "/:id/photo",
  profilePhotoUpload.single("photo"),
  updateAdminTrainerPhotoController
);

trainerAdminRouter.post(
  "/:id/reset-password",
  resetAdminTrainerPasswordController
);

export default trainerAdminRouter;