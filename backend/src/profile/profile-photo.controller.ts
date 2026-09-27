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
 * GET CURRENT USER PROFILE
 * ============================================================
 *
 * GET /api/profile/me
 *
 * Returns the currently authenticated user's basic profile
 * information including profilePhotoUrl.
 *
 * ============================================================
 */

export async function getMyProfileController(
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

    const user = await db.orm.public.User.first({
      id: req.user.userId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        profilePhotoUrl:
          user.profilePhotoUrl ?? null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/*
 * ============================================================
 * UPLOAD OWN PROFILE PHOTO
 * ============================================================
 *
 * POST /api/profile/photo
 *
 * Authenticated users can upload their own profile photo.
 *
 * ============================================================
 */

export async function uploadProfilePhotoController(
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

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required",
      });
    }

    const profilePhotoUrl =
      `/uploads/profile/${file.filename}`;

    const userId = req.user.userId;

    const updatedUser =
      await db.orm.public.User
        .where({
          id: userId,
        })
        .update({
          profilePhotoUrl,
        });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Profile photo updated successfully",
      data: {
        profilePhotoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}