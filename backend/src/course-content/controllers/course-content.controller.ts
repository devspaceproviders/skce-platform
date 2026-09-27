import type { Request, Response } from "express";
import { getCourseContentForStudent } from "../services/course-content.service";

export async function getCourseContent(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const data =
      await getCourseContentForStudent(
        req.user.userId,
        courseId
      );

    return res.status(200).json({
      success: true,
      message: "Course content retrieved successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Get course content error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve course content";

    if (message === "Course not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "You are not enrolled in this course"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve course content",
    });
  }
}