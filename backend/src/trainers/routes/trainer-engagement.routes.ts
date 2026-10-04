import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  getTrainerEngagementsController,
} from "../controllers/trainer-engagement.controller";

const router = Router();

router.use(
  authenticate,
  requireRole("TRAINER")
);

router.get(
  "/",
  getTrainerEngagementsController
);

export default router;
