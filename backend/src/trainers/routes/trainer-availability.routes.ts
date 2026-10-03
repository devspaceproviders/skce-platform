import { Router } from "express";

import {
  createTrainerAvailabilityController,
  deleteTrainerAvailabilityController,
  listTrainerAvailabilityController,
  updateTrainerAvailabilityController,
} from "../controllers/trainer-availability.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/*
 * Admin manages trainer availability.
 *
 * GET    /:trainerId
 * POST   /:trainerId
 * PUT    /slot/:id
 * DELETE /slot/:id
 */

router.get(
  "/:trainerId",
  authenticate,
  requireRole("ADMIN"),
  listTrainerAvailabilityController
);

router.post(
  "/:trainerId",
  authenticate,
  requireRole("ADMIN"),
  createTrainerAvailabilityController
);

router.put(
  "/slot/:id",
  authenticate,
  requireRole("ADMIN"),
  updateTrainerAvailabilityController
);

router.delete(
  "/slot/:id",
  authenticate,
  requireRole("ADMIN"),
  deleteTrainerAvailabilityController
);

export default router;