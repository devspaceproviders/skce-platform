import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import {
  getAdminHomepagePopupController,
  updateAdminHomepagePopup,
  uploadHomepagePopupImageController,
  uploadHomepagePopupVideoController,
} from "../controllers/homepage-popup-admin.controller";

import {
  homepagePopupImageUpload,
} from "../middleware/homepage-popup-image.upload";

import homepagePopupVideoUpload from "../middleware/homepage-popup-video.upload";

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

router.get(
  "/",
  getAdminHomepagePopupController
);

router.patch(
  "/",
  updateAdminHomepagePopup
);

router.post(
  "/image",
  homepagePopupImageUpload.single("image"),
  uploadHomepagePopupImageController
);

router.post(
  "/video",
  homepagePopupVideoUpload.single("video"),
  uploadHomepagePopupVideoController,

  /*
   * Handle Multer upload errors as JSON instead of
   * allowing Express to return an HTML error page.
   */
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message:
            "Video file is too large. Maximum allowed size is 100 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
);

export default router;