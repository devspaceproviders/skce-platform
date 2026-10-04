import type {
  Request,
  Response,
} from "express";

import {
  getAdminStudentProgress,
} from "../services/admin-student-progress.service";

type AuthenticatedRequest =
  Request & {
    user?: {
      userId: number;
      role:
        | "ADMIN"
        | "STUDENT"
        | "TRAINER";
    };
  };

export async function
getAdminStudentProgressController(
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

    const studentId =
      String(
        req.params.studentId ?? ""
      ).trim();

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID is required",
      });
    }

    const data =
      await getAdminStudentProgress(
        studentId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get admin student progress error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load student progress";

    const status =
      message === "Student not found"
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}