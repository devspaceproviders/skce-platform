import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  getAdminCeoController,
  updateAdminCeoController,
} from "../controllers/admin-ceo.controller";

const adminCeoRouter = Router();

adminCeoRouter.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  getAdminCeoController
);

adminCeoRouter.patch(
  "/",
  authenticate,
  requireRole("ADMIN"),
  updateAdminCeoController
);

export default adminCeoRouter;