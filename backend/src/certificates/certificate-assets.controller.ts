import type {
  NextFunction,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../auth/middleware/auth.middleware";

import { db } from "../prisma/db";

/*
 * ============================================================
 * CERTIFICATE ASSET TYPES
 * ============================================================
 */

type CertificateAssetType =
  | "LOGO"
  | "SIGNATURE";

/*
 * ============================================================
 * GET CERTIFICATE SETTINGS
 * ============================================================
 *
 * GET /api/admin/certificate-assets
 *
 * Returns the currently configured certificate logo
 * and signature.
 *
 * ============================================================
 */

export async function getCertificateAssetsController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const settings =
      await db.orm.public.CertificateSetting
        .first();

    return res.status(200).json({
      success: true,
      data: {
        logoUrl:
          settings?.logoUrl ?? null,
        signatureUrl:
          settings?.signatureUrl ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/*
 * ============================================================
 * UPLOAD CERTIFICATE ASSET
 * ============================================================
 *
 * POST /api/admin/certificate-assets/:type
 *
 * Supported types:
 *
 * LOGO
 * SIGNATURE
 *
 * Content-Type:
 * multipart/form-data
 *
 * Field name:
 * file
 *
 * ============================================================
 */

export async function uploadCertificateAssetController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const type =
      String(req.params.type || "")
        .trim()
        .toUpperCase() as CertificateAssetType;

    if (
      type !== "LOGO" &&
      type !== "SIGNATURE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid certificate asset type. Use LOGO or SIGNATURE.",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message:
          "Certificate asset file is required",
      });
    }

    const assetUrl =
      `/uploads/certificate-assets/${file.filename}`;

    const existingSettings =
      await db.orm.public.CertificateSetting
        .first();

    let settings;

    if (existingSettings) {
      settings =
        await db.orm.public.CertificateSetting
          .where({
            id: existingSettings.id,
          })
          .update(
            type === "LOGO"
              ? {
                  logoUrl: assetUrl,
                }
              : {
                  signatureUrl: assetUrl,
                }
          );
    } else {
      settings =
        await db.orm.public.CertificateSetting
          .create(
            type === "LOGO"
              ? {
                  logoUrl: assetUrl,
                }
              : {
                  signatureUrl: assetUrl,
                }
          );
    }

    return res.status(200).json({
      success: true,
      message:
        type === "LOGO"
          ? "Certificate logo uploaded successfully"
          : "Certificate signature uploaded successfully",
      data: {
        type,
        assetUrl,
        filename: file.filename,
        settings,
      },
    });
  } catch (error) {
    next(error);
  }
}