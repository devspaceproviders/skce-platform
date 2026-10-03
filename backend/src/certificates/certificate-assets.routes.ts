import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../auth/middleware/auth.middleware";

import {
  getCertificateAssetsController,
  uploadCertificateAssetController,
} from "./certificate-assets.controller";

import {
  certificateAssetUpload,
} from "./certificate-assets.upload";

const certificateAssetRouter =
  Router();

/*
 * ============================================================
 * ADMIN CERTIFICATE ASSETS
 * ============================================================
 *
 * All certificate asset operations are ADMIN only.
 *
 * Supported assets:
 *
 * LOGO
 * SIGNATURE
 *
 * ============================================================
 */

certificateAssetRouter.use(
  authenticate,
  requireRole("ADMIN")
);

/*
 * GET /api/admin/certificate-assets
 *
 * Returns the currently configured certificate
 * logo and signature.
 */

certificateAssetRouter.get(
  "/",
  getCertificateAssetsController
);

/*
 * POST /api/admin/certificate-assets/:type
 *
 * Content-Type:
 * multipart/form-data
 *
 * Field:
 * file
 *
 * Examples:
 *
 * POST /api/admin/certificate-assets/LOGO
 * POST /api/admin/certificate-assets/SIGNATURE
 */

certificateAssetRouter.post(
  "/:type",
  certificateAssetUpload.single("file"),
  uploadCertificateAssetController
);

export default certificateAssetRouter;