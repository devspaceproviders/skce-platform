import type { Request, Response } from "express";

import {
  createPackage,
  getAdminPackageById,
  listAdminPackages as listPackages,
  updatePackage,
  updatePackageImage,
  deletePackage,
} from "../services/package-admin.service";

function parseId(value: unknown) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid package ID");
  }

  return id;
}

function sendError(res: Response, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Package operation failed";

  const status =
    message === "Access denied"
      ? 403
      : message.includes("not found") ||
          message.includes("Not found")
        ? 404
        : 400;

  return res.status(status).json({
    success: false,
    message,
  });
}

export async function listAdminPackages(
  _req: Request,
  res: Response
) {
  try {
    const data = await listPackages();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List admin packages error:", error);
    return sendError(res, error);
  }
}

export async function createAdminPackage(
  req: Request,
  res: Response
) {
  try {
    const body = req.body || {};

    const data = await createPackage({
      title: body.title,
      description: body.description,
      price: body.price,
      courseIds: body.courseIds,
      isActive: body.isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully.",
      data,
    });
  } catch (error) {
    console.error("Create admin package error:", error);
    return sendError(res, error);
  }
}

export async function getAdminPackage(
  req: Request,
  res: Response
) {
  try {
    const packageId = parseId(req.params.id);
    const data = await getAdminPackageById(packageId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get admin package error:", error);
    return sendError(res, error);
  }
}

export async function updateAdminPackage(
  req: Request,
  res: Response
) {
  try {
    const packageId = parseId(req.params.id);
    const body = req.body || {};

    const data = await updatePackage(
      packageId,
      {
        title: body.title,
        description: body.description,
        price: body.price,
        courseIds: body.courseIds,
        isActive: body.isActive,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Package updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Update admin package error:", error);
    return sendError(res, error);
  }
}

export async function deleteAdminPackage(
  req: Request,
  res: Response
) {
  try {
    const packageId = parseId(req.params.id);

    const data = await deletePackage(
      packageId
    );

    return res.status(200).json({
      success: true,
      message: "Package deleted successfully.",
      data,
    });
  } catch (error) {
    console.error(
      "Delete admin package error:",
      error
    );

    return sendError(res, error);
  }
}

/*
 * ============================================================
 * PACKAGE IMAGE
 * ============================================================
 *
 * POST /api/admin/packages/:id/image
 *
 * ADMIN only.
 *
 * Content-Type:
 * multipart/form-data
 *
 * Field name:
 * image
 *
 * ============================================================
 */

export async function uploadPackageImageController(
  req: Request,
  res: Response
) {
  try {
    const idParam = req.params.id;

    const packageId = Number(idParam);

    if (
      !Number.isInteger(packageId) ||
      packageId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid package ID is required",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Package image is required",
      });
    }

    const imageUrl =
      `/uploads/packages/${file.filename}`;

    const coursePackage =
      await updatePackageImage(
        packageId,
        imageUrl
      );

    return res.status(200).json({
      success: true,
      message:
        "Package image updated successfully",
      data: coursePackage,
    });
  } catch (error) {
    console.error(
      "Upload package image error:",
      error
    );

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
      message:
        error instanceof Error
          ? error.message
          : "Unable to upload package image",
    });
  }
}
