import { Router } from "express";

import {
  listAdminPackages,
  createAdminPackage,
  getAdminPackage,
  updateAdminPackage,
} from "../controllers/package-admin.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/*
 * All routes in this file are ADMIN only.
 */
router.use(
  authenticate,
  requireRole("ADMIN")
);

router.get("/", listAdminPackages);

router.post("/", createAdminPackage);

router.get("/:id", getAdminPackage);

router.patch("/:id", updateAdminPackage);

export default router;
