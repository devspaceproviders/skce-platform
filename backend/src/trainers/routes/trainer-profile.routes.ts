import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  getTrainerProfileController,
  updateTrainerProfileController,
} from "../controllers/trainer-profile.controller";

const trainerProfileRouter =
  Router();

trainerProfileRouter.use(
  authenticate,
  requireRole("TRAINER")
);

trainerProfileRouter.get(
  "/",
  getTrainerProfileController
);

trainerProfileRouter.patch(
  "/",
  updateTrainerProfileController
);

export default trainerProfileRouter;