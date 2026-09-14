import type { Request, Response } from "express";

import {
  getAllCourses,
  getCourseBySlug,
} from "../services/course.service";

export async function getCourses(
  _req: Request,
  res: Response
) {
  try {
    const courses = await getAllCourses();

    return res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve courses",
    });
  }
}

export async function getCourse(
  req: Request,
  res: Response
) {
  try {
    const slugParam = req.params.slug;

    // Express can type route parameters as string | string[].
    // We only accept a single string slug.
    if (typeof slugParam !== "string" || !slugParam.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course slug is required",
      });
    }

    const course = await getCourseBySlug(slugParam);

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: course,
    });
  } catch (error) {
    console.error("Get course error:", error);

    if (
      error instanceof Error &&
      error.message === "Course not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve course",
    });
  }
}