import type { Request, Response } from "express";

import {
  getAllPackages,
  getPackageBySlug,
} from "../services/package.service";

export async function getPackages(
  _req: Request,
  res: Response
) {
  try {
    const packages = await getAllPackages();

    return res.status(200).json({
      success: true,
      message: "Packages retrieved successfully",
      data: packages,
    });
  } catch (error) {
    console.error("Get packages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve packages",
    });
  }
}

export async function getPackage(
  req: Request,
  res: Response
) {
  try {
    const slugParam = req.params.slug;

    if (typeof slugParam !== "string" || !slugParam.trim()) {
      return res.status(400).json({
        success: false,
        message: "Package slug is required",
      });
    }

    const coursePackage = await getPackageBySlug(slugParam);

    return res.status(200).json({
      success: true,
      message: "Package retrieved successfully",
      data: coursePackage,
    });
  } catch (error) {
    console.error("Get package error:", error);

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