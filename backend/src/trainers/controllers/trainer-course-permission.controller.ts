import type { Request, Response } from "express";

import {
  createTrainerCoursePermission,
  deleteTrainerCoursePermission,
  getTrainerCoursePermission,
  listTrainerCoursePermissions,
  updateTrainerCoursePermission,
} from "../services/trainer-course-permission.service";

function parseId(
  value: string | string[] | undefined
): number | null {
  if (!value || Array.isArray(value)) {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function listPermissions(
  _req: Request,
  res: Response
) {
  try {
    const permissions =
      await listTrainerCoursePermissions();

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error(
      "Failed to list trainer course permissions:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load trainer course permissions",
    });
  }
}

export async function getPermission(
  req: Request,
  res: Response
) {
  const trainerId = parseId(req.params.trainerId);
  const courseId = parseId(req.params.courseId);

  if (!trainerId || !courseId) {
    return res.status(400).json({
      success: false,
      message: "Invalid trainerId or courseId",
    });
  }

  try {
    const permission =
      await getTrainerCoursePermission(
        trainerId,
        courseId
      );

    if (!permission) {
      return res.status(404).json({
        success: false,
        message:
          "Permission not found for this trainer and course",
      });
    }

    return res.status(200).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error(
      "Failed to get trainer course permission:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load trainer course permission",
    });
  }
}

export async function createPermission(
  req: Request,
  res: Response
) {
  const trainerId = Number(req.body?.trainerId);
  const courseId = Number(req.body?.courseId);

  if (
    !Number.isInteger(trainerId) ||
    trainerId <= 0 ||
    !Number.isInteger(courseId) ||
    courseId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Valid trainerId and courseId are required",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const permission =
      await createTrainerCoursePermission(
        {
          trainerId,
          courseId,
          canTeach: req.body?.canTeach,
          canManageContent:
            req.body?.canManageContent,
          canCreateAssessments:
            req.body?.canCreateAssessments,

        },
        req.user.userId
      );

    return res.status(201).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Permission already exists"
      )
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Failed to create trainer course permission:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create trainer course permission",
    });
  }
}

export async function updatePermission(
  req: Request,
  res: Response
) {
  const trainerId = parseId(req.params.trainerId);
  const courseId = parseId(req.params.courseId);

  if (!trainerId || !courseId) {
    return res.status(400).json({
      success: false,
      message: "Invalid trainerId or courseId",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const permission =
      await updateTrainerCoursePermission(
        trainerId,
        courseId,
        {
          canTeach: req.body?.canTeach,
          canManageContent:
            req.body?.canManageContent,
          canCreateAssessments:
            req.body?.canCreateAssessments,
         
        },
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Permission not found"
      )
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Failed to update trainer course permission:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update trainer course permission",
    });
  }
}

export async function deletePermission(
  req: Request,
  res: Response
) {
  const trainerId = parseId(req.params.trainerId);
  const courseId = parseId(req.params.courseId);

  if (!trainerId || !courseId) {
    return res.status(400).json({
      success: false,
      message: "Invalid trainerId or courseId",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const result =
      await deleteTrainerCoursePermission(
        trainerId,
        courseId,
        req.user.userId
      );

    return res.status(200).json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Permission not found"
      )
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Failed to delete trainer course permission:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete trainer course permission",
    });
  }
}