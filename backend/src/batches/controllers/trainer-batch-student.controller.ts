import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../../auth/middleware/auth.middleware";

import {
  getTrainerProfileId,
} from "../services/batch.service";

import {
  getTrainerBatchStudentDetails,
} from "../services/trainer-batch-student.service";

function parseId(value: unknown) {
  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid ID"
    );
  }

  return id;
}

function sendError(
  res: Response,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to load student details";

  const lowerMessage =
    message.toLowerCase();

  const status =
    message === "Access denied"
      ? 403
      : lowerMessage.includes("not found") ||
          lowerMessage.includes("not assigned")
        ? 404
        : 400;

  return res
    .status(status)
    .json({
      success: false,
      message,
    });
}

export async function getTrainerBatchStudentDetailsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required",
        });
    }

    const batchId =
      parseId(
        req.params.batchId
      );

    const studentProfileId =
      parseId(
        req.params.studentId
      );

    const trainerId =
      await getTrainerProfileId(
        req.user.userId
      );

    const data =
      await getTrainerBatchStudentDetails(
        trainerId,
        batchId,
        studentProfileId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get trainer batch student details error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}
