import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../../auth/middleware/auth.middleware";

import {
  getTrainerEngagementsByUserId,
} from "../services/trainer-engagement.service";

export async function getTrainerEngagementsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const data =
      await getTrainerEngagementsByUserId(
        req.user.userId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get trainer engagements error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load trainer engagements",
    });
  }
}
