import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/middleware/auth.middleware";
import {
  listCurrentTrainerCoursePermissions,
} from "../services/trainer-course-permission.service";

export async function getMyTrainerCoursePermissions(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "TRAINER") {
      return res.status(403).json({
        success: false,
        message: "Trainer access required",
      });
    }

    const permissions =
      await listCurrentTrainerCoursePermissions(
        user.userId
      );

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error(
      "Get trainer course permissions error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load trainer course permissions";

    if (message === "Trainer profile not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
}