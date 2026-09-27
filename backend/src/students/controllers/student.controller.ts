import type { Response } from "express";

import type { AuthenticatedRequest } from "../../auth/middleware/auth.middleware";

import {
  getAllStudents,
  getStudentByStudentId,
  getStudentDashboard,
  updateMyPhone,
} from "../services/student.service";

/*
 * ==========================================================
 * GET ALL STUDENTS
 * ==========================================================
 *
 * ADMIN ONLY
 */

export async function getStudents(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const students =
      await getAllStudents();

    return res.status(200).json({
      success: true,
      message:
        "Students retrieved successfully",
      data: students,
    });
  } catch (error) {
    console.error(
      "Failed to retrieve students:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve students",
    });
  }
}

/*
 * ==========================================================
 * GET STUDENT BY STUDENT ID
 * ==========================================================
 *
 * ADMIN ONLY
 */

export async function getStudent(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const studentId =
      req.params.studentId;

    if (
      typeof studentId !== "string" ||
      !studentId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student ID is required",
      });
    }

    const student =
      await getStudentByStudentId(
        studentId
      );

    return res.status(200).json({
      success: true,
      message:
        "Student retrieved successfully",
      data: student,
    });
  } catch (error) {
    console.error(
      "Failed to retrieve student:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "Student not found"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "Student user account not found"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Student user account not found",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve student",
    });
  }
}

/*
 * ==========================================================
 * GET MY STUDENT DASHBOARD
 * ==========================================================
 *
 * STUDENT ONLY
 *
 * The authenticated user ID comes from the JWT.
 */

export async function getMyDashboard(
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

    const dashboard =
      await getStudentDashboard(
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Student dashboard retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error(
      "Failed to retrieve student dashboard:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "Student user account not found"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Student user account not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "Student profile not found"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve student dashboard",
    });
  }
}

/*
 * ==========================================================
 * UPDATE MY MOBILE NUMBER
 * ==========================================================
 *
 * STUDENT ONLY
 *
 * Only the authenticated student's User.phone field can
 * be changed. All registration/profile fields remain
 * read-only.
 */

export async function updateMyPhoneNumber(
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

    const { phone } = req.body;

    if (
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number is required",
      });
    }

    const result =
      await updateMyPhone(
        req.user.userId,
        phone
      );

    return res.status(200).json({
      success: true,
      message:
        "Mobile number updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to update mobile number:",
      error
    );

    if (error instanceof Error) {
      if (
        error.message ===
        "Mobile number is required"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
        "Please enter a valid 10-digit mobile number"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message ===
        "Student user account not found"
      ) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update mobile number",
    });
  }
}