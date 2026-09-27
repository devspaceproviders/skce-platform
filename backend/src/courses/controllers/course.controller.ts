import type { Request, Response } from "express";

import {
  getAllCourses,
  getCourseBySlug,
  getAllCoursesForAdmin,
  getCourseByIdForAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../services/course.service";

/*
 * ============================================================
 * PUBLIC
 * ============================================================
 */

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

    if (
      typeof slugParam !== "string" ||
      !slugParam.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Course slug is required",
      });
    }

    const course =
      await getCourseBySlug(slugParam);

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

/*
 * ============================================================
 * ADMIN
 * ============================================================
 */

export async function getAdminCourses(
  _req: Request,
  res: Response
) {
  try {
    const courses =
      await getAllCoursesForAdmin();

    return res.status(200).json({
      success: true,
      message:
        "Admin courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    console.error(
      "Get admin courses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve courses",
    });
  }
}

export async function getAdminCourse(
  req: Request,
  res: Response
) {
  try {
    const idParam = req.params.id;

    const courseId = Number(idParam);

    if (
      !Number.isInteger(courseId) ||
      courseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid course ID is required",
      });
    }

    const course =
      await getCourseByIdForAdmin(courseId);

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: course,
    });
  } catch (error) {
    console.error(
      "Get admin course error:",
      error
    );

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

export async function createCourseController(
  req: Request,
  res: Response
) {
  try {
    const {
      title,
      description,
      mode,
      duration,
      price,
      isActive,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Course title is required",
      });
    }

    if (
      mode !== undefined &&
      mode !== "ONLINE" &&
      mode !== "OFFLINE" &&
      mode !== "HYBRID"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mode must be ONLINE, OFFLINE or HYBRID",
      });
    }

    if (
      price !== undefined &&
      (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be a valid non-negative number",
      });
    }

    const course =
      await createCourse({
        title,
        description,
        mode,
        duration,
        price,
        isActive,
      });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error(
      "Create course error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create course",
    });
  }
}

export async function updateCourseController(
  req: Request,
  res: Response
) {
  try {
    const idParam = req.params.id;

    const courseId = Number(idParam);

    if (
      !Number.isInteger(courseId) ||
      courseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid course ID is required",
      });
    }

    const {
      title,
      description,
      mode,
      duration,
      price,
      isActive,
    } = req.body;

    if (
      title !== undefined &&
      (
        typeof title !== "string" ||
        !title.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Course title cannot be empty",
      });
    }

    if (
      mode !== undefined &&
      mode !== "ONLINE" &&
      mode !== "OFFLINE" &&
      mode !== "HYBRID"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mode must be ONLINE, OFFLINE or HYBRID",
      });
    }

    if (
      price !== undefined &&
      (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price must be a valid non-negative number",
      });
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false",
      });
    }

    const course =
      await updateCourse(
        courseId,
        {
          title,
          description,
          mode,
          duration,
          price,
          isActive,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error(
      "Update course error:",
      error
    );

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
      message:
        error instanceof Error
          ? error.message
          : "Unable to update course",
    });
  }
}

export async function deleteCourseController(
  req: Request,
  res: Response
) {
  try {
    const idParam = req.params.id;

    const courseId = Number(idParam);

    if (
      !Number.isInteger(courseId) ||
      courseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid course ID is required",
      });
    }

    await deleteCourse(courseId);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete course error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Course not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "students are enrolled"
      )
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to delete course",
    });
  }
}