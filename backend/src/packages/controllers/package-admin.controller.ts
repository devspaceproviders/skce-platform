import type { Request, Response } from "express";

import {
  getAdminPackageById,
  updatePackage,
} from "../services/package-admin.service";

export async function getAdminPackage(
  req: Request,
  res: Response
) {
  try {
    const idParam = req.params.id;

    if (typeof idParam !== "string" || !idParam.trim()) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const packageId = Number(idParam);

    if (!Number.isInteger(packageId) || packageId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const coursePackage =
      await getAdminPackageById(packageId);

    return res.status(200).json({
      success: true,
      message: "Package retrieved successfully",
      data: coursePackage,
    });
  } catch (error) {
    console.error("Get admin package error:", error);

    if (
      error instanceof Error &&
      error.message === "Package not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve package",
    });
  }
}

export async function updateAdminPackage(
  req: Request,
  res: Response
) {
  try {
    const idParam = req.params.id;

    if (typeof idParam !== "string" || !idParam.trim()) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const packageId = Number(idParam);

    if (!Number.isInteger(packageId) || packageId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const body = req.body ?? {};

    const input: {
      title?: string;
      description?: string | null;
      price?: number;
      courseIds?: number[];
    } = {};

    if (body.title !== undefined) {
      input.title = body.title;
    }

    if (body.description !== undefined) {
      input.description = body.description;
    }

    if (body.price !== undefined) {
      input.price = Number(body.price);
    }

    if (body.courseIds !== undefined) {
      if (!Array.isArray(body.courseIds)) {
        return res.status(400).json({
          success: false,
          message: "courseIds must be an array",
        });
      }

      input.courseIds = body.courseIds.map(
        (courseId: unknown) => Number(courseId)
      );
    }

    if (Object.keys(input).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No package changes were provided",
      });
    }

    const updatedPackage = await updatePackage(
      packageId,
      input
    );

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: updatedPackage,
    });
  } catch (error) {
    console.error("Update admin package error:", error);

    if (
      error instanceof Error &&
      error.message === "Package not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (error instanceof Error) {
      const validationMessages = [
        "Package title is required",
        "Package price must be a valid positive amount",
        "courseIds must be an array",
        "Invalid course ID",
      ];

      if (
        validationMessages.includes(error.message) ||
        error.message.startsWith("Invalid or inactive course IDs:")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update package",
    });
  }
}