import type { Request, Response } from "express";

import {
  startLesson,
  completeLesson,
  getCourseProgress,
} from "../services/course-progress.service";


export async function startLessonController(
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

    const lessonId = Number(
      req.params.lessonId
    );

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const progress =
      await startLesson(
        req.user.userId,
        lessonId
      );

    return res.status(200).json({
      success: true,
      message: "Lesson started successfully",
      data: progress,
    });
  } catch (error) {
    console.error(
      "Start lesson error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to start lesson";

    if (
      message === "Lesson not found" ||
      message === "Course module not found" ||
      message === "Course not found"
    ) {
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
      message: "Unable to start lesson",
    });
  }
}


export async function completeLessonController(
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

    const lessonId = Number(
      req.params.lessonId
    );

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const progress =
      await completeLesson(
        req.user.userId,
        lessonId
      );

    return res.status(200).json({
      success: true,
      message:
        "Lesson completed successfully",
      data: progress,
    });
  } catch (error) {
    console.error(
      "Complete lesson error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete lesson";

    if (
      message === "Lesson not found" ||
      message === "Course module not found" ||
      message === "Course not found"
    ) {
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
        "Unable to complete lesson",
    });
  }
}


export async function getCourseProgressController(
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

    const courseId = Number(
      req.params.courseId
    );

    if (
      !Number.isInteger(courseId) ||
      courseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const progress =
      await getCourseProgress(
        req.user.userId,
        courseId
      );

    return res.status(200).json({
      success: true,
      message:
        "Course progress retrieved successfully",
      data: progress,
    });
  } catch (error) {
    console.error(
      "Get course progress error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve course progress";

    if (
      message === "Course not found"
    ) {
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
        "Unable to retrieve course progress",
    });
  }
}