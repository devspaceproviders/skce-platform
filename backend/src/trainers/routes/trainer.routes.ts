import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  listPublicTrainers,
} from "../services/trainer.service";

import {
  createAdminTrainerController,
  getAdminTrainerController,
  getAdminTrainerEngagementsController,
  listAdminTrainersController,
  resetAdminTrainerPasswordController,
  updateAdminTrainerController,
} from "../controllers/trainer.controller";

import {
  getTrainerActivityController,
} from "../controllers/trainer-activity.controller";

/* ============================================================
   PUBLIC TRAINERS
   ============================================================ */

export const publicTrainerRouter = Router();

publicTrainerRouter.get(
  "/",
  async (_req, res) => {
    try {
      const trainers =
        await listPublicTrainers();

      return res.status(200).json({
        success: true,
        data: trainers,
      });
    } catch (error) {
      console.error(
        "Failed to load public trainers:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load trainers.",
      });
    }
  }
);

/* ============================================================
   ADMIN TRAINERS
   ============================================================ */

const trainerAdminRouter = Router();

trainerAdminRouter.use(
  authenticate,
  requireRole("ADMIN")
);

trainerAdminRouter.get(
  "/",
  listAdminTrainersController
);

trainerAdminRouter.get(
  "/:id/activity",
  getTrainerActivityController
);

trainerAdminRouter.get(
  "/:id/engagements",
  getAdminTrainerEngagementsController
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

trainerAdminRouter.post(
  "/:id/reset-password",
  resetAdminTrainerPasswordController
);

export default trainerAdminRouter;