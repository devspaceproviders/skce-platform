import { Router } from "express";

import { authenticate } from "../../auth/middleware/auth.middleware";
import { requireRole } from "../../auth/middleware/role.middleware";

import {
  getAdminReportsController,
} from "../controllers/admin-reports.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  getAdminReportsController
);

export default router;