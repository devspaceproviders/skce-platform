import { Router } from "express";

import {
  listAdminPackages,
  createAdminPackage,
  getAdminPackage,
  updateAdminPackage,
  uploadPackageImageController,
  deleteAdminPackage,
} from "../controllers/package-admin.controller";

import {
  packageImageUpload,
} from "../middleware/package-image.upload";

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

router.delete(
  "/:id",
  deleteAdminPackage
);

router.post(
  "/:id/image",
  packageImageUpload.single("image"),
  uploadPackageImageController
);

export default router;
