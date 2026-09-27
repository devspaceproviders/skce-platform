import type { Request, Response } from "express";

import {
  getAdminCourseContent,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderModule,
  reorderLesson,
} from "../services/course-content-admin.service";

/* =========================================================
   GET COURSE CONTENT
========================================================= */

export async function getAdminCourseContentController(
  req: Request,
  res: Response
) {
  try {
    const courseId =
      Number(req.params.courseId);

    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const data =
      await getAdminCourseContent(
        courseId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get admin course content error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load course content",
    });
  }
}

/* =========================================================
   CREATE MODULE
========================================================= */

export async function createModuleController(
  req: Request,
  res: Response
) {
  try {
    const courseId =
      Number(req.params.courseId);

    const {
      title,
      description,
    } = req.body;

    if (
      Number.isNaN(courseId) ||
      !title?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Course ID and module title are required",
      });
    }

    const module =
      await createModule(
        courseId,
        title.trim(),
        description?.trim()
      );

    return res.status(201).json({
      success: true,
      data: module,
      message:
        "Module created successfully",
    });
  } catch (error) {
    console.error(
      "Create module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create module",
    });
  }
}

/* =========================================================
   UPDATE MODULE
========================================================= */

export async function updateModuleController(
  req: Request,
  res: Response
) {
  try {
    const moduleId =
      Number(req.params.moduleId);

    const {
      title,
      description,
    } = req.body;

    if (
      Number.isNaN(moduleId) ||
      !title?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Module ID and module title are required",
      });
    }

    const module =
      await updateModule(
        moduleId,
        title.trim(),
        description?.trim()
      );

    return res.status(200).json({
      success: true,
      data: module,
      message:
        "Module updated successfully",
    });
  } catch (error) {
    console.error(
      "Update module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update module",
    });
  }
}

/* =========================================================
   DELETE MODULE
========================================================= */

export async function deleteModuleController(
  req: Request,
  res: Response
) {
  try {
    const moduleId =
      Number(req.params.moduleId);

    if (Number.isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const result =
      await deleteModule(moduleId);

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete module",
    });
  }
}

/* =========================================================
   CREATE LESSON
========================================================= */

export async function createLessonController(
  req: Request,
  res: Response
) {
  try {
    const moduleId =
      Number(req.params.moduleId);

    const {
      title,
      description,
      content,
      videoUrl,
      documentUrl,
    } = req.body;

    if (
      Number.isNaN(moduleId) ||
      !title?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Module ID and lesson title are required",
      });
    }

    const lesson =
      await createLesson(
        moduleId,
        title.trim(),
        description?.trim(),
        content?.trim(),
        videoUrl?.trim(),
        documentUrl?.trim()
      );

    return res.status(201).json({
      success: true,
      data: lesson,
      message:
        "Lesson created successfully",
    });
  } catch (error) {
    console.error(
      "Create lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create lesson",
    });
  }
}

/* =========================================================
   UPDATE LESSON
========================================================= */

export async function updateLessonController(
  req: Request,
  res: Response
) {
  try {
    const lessonId =
      Number(req.params.lessonId);

    const {
      title,
      description,
      content,
      videoUrl,
      documentUrl,
    } = req.body;

    if (
      Number.isNaN(lessonId) ||
      !title?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Lesson ID and lesson title are required",
      });
    }

    const lesson =
      await updateLesson(
        lessonId,
        title.trim(),
        description?.trim(),
        content?.trim(),
        videoUrl?.trim(),
        documentUrl?.trim()
      );

    return res.status(200).json({
      success: true,
      data: lesson,
      message:
        "Lesson updated successfully",
    });
  } catch (error) {
    console.error(
      "Update lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update lesson",
    });
  }
}

/* =========================================================
   DELETE LESSON
========================================================= */

export async function deleteLessonController(
  req: Request,
  res: Response
) {
  try {
    const lessonId =
      Number(req.params.lessonId);

    if (Number.isNaN(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const result =
      await deleteLesson(lessonId);

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete lesson",
    });
  }
}

/* =========================================================
   REORDER MODULE
========================================================= */

export async function reorderModuleController(
  req: Request,
  res: Response
) {
  try {
    const moduleId =
      Number(req.params.moduleId);

    const direction =
      String(
        req.body?.direction || ""
      ).toUpperCase();

    if (Number.isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    if (
      direction !== "UP" &&
      direction !== "DOWN"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Direction must be UP or DOWN",
      });
    }

    const result =
      await reorderModule(
        moduleId,
        direction as "UP" | "DOWN"
      );

    return res.status(200).json({
      success: true,
      message:
        result?.message ||
        "Module reordered successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Reorder module error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reorder module",
    });
  }
}

/* =========================================================
   REORDER LESSON
========================================================= */

export async function reorderLessonController(
  req: Request,
  res: Response
) {
  try {
    const lessonId =
      Number(req.params.lessonId);

    const direction =
      String(
        req.body?.direction || ""
      ).toUpperCase();

    if (Number.isNaN(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    if (
      direction !== "UP" &&
      direction !== "DOWN"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Direction must be UP or DOWN",
      });
    }

    const result =
      await reorderLesson(
        lessonId,
        direction as "UP" | "DOWN"
      );

    return res.status(200).json({
      success: true,
      message:
        result?.message ||
        "Lesson reordered successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Reorder lesson error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reorder lesson",
    });
  }
}