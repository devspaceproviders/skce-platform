import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../../auth/middleware/auth.middleware";

import {
  getTrainerProfile,
  updateTrainerProfile,
  type TrainerProfileUpdateInput,
} from "../services/trainer-profile.service";

export async function getTrainerProfileController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const profile =
      await getTrainerProfile(
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      "Get trainer profile error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load trainer profile.";

    const status =
      message ===
        "Trainer account not found." ||
      message ===
        "Trainer profile not found."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function updateTrainerProfileController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const body =
      req.body || {};

    const input: TrainerProfileUpdateInput =
      {};

    if (
      body.name !== undefined
    ) {
      if (
        typeof body.name !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must be a string.",
        });
      }

      input.name =
        body.name;
    }

    if (
      body.phone !== undefined
    ) {
      if (
        body.phone !== null &&
        typeof body.phone !==
          "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone must be a string.",
        });
      }

      input.phone =
        body.phone;
    }

    if (
      body.specialization !==
      undefined
    ) {
      if (
        body.specialization !==
          null &&
        typeof body.specialization !==
          "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Specialization must be a string.",
        });
      }

      input.specialization =
        body.specialization;
    }

    const profile =
      await updateTrainerProfile(
        req.user.userId,
        input
      );

    return res.status(200).json({
      success: true,
      message:
        "Trainer profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error(
      "Update trainer profile error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update trainer profile.";

    const status =
      message ===
        "Trainer account not found." ||
      message ===
        "Trainer profile not found."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}