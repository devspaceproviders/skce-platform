import type {
  NextFunction,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../../auth/middleware/auth.middleware";

import {
  getAdminCeoProfile,
  updateAdminCeoProfile,
} from "../services/ceo-admin.service";

export async function getAdminCeoController(
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

    const data =
      await getAdminCeoProfile(
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdminCeoController(
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

    const data =
      await updateAdminCeoProfile(
        req.user.userId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "CEO information updated successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}