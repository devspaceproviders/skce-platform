import type { Request, Response } from "express";

import {
  getAdminHomepagePopup,
  updateHomepagePopup,
  updateHomepagePopupImage,
  updateHomepagePopupVideo,
} from "../services/homepage-popup-admin.service";

export async function getAdminHomepagePopupController(
  _req: Request,
  res: Response
) {
  try {
    const data =
      await getAdminHomepagePopup();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get admin homepage popup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve homepage popup",
    });
  }
}

export async function updateAdminHomepagePopup(
  req: Request,
  res: Response
) {
  try {
    const body = req.body || {};

    const data =
      await updateHomepagePopup({
        title: body.title,
        message: body.message,
        buttonText: body.buttonText,
        buttonLink: body.buttonLink,
        isActive: body.isActive,
      });

    return res.status(200).json({
      success: true,
      message:
        "Homepage popup updated successfully.",
      data,
    });
  } catch (error) {
    console.error(
      "Update admin homepage popup error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Homepage popup update failed";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function uploadHomepagePopupImageController(
  req: Request,
  res: Response
) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message:
          "Homepage popup image is required",
      });
    }

    const imageUrl =
      `/uploads/homepage-popup/${file.filename}`;

    const data =
      await updateHomepagePopupImage(
        imageUrl
      );

    return res.status(200).json({
      success: true,
      message:
        "Homepage popup image updated successfully.",
      data,
    });
  } catch (error) {
    console.error(
      "Upload homepage popup image error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to upload homepage popup image";

    const status =
      message.includes("not found") ||
      message.includes("Not found")
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function uploadHomepagePopupVideoController(
  req: Request,
  res: Response
) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message:
          "Homepage popup video is required",
      });
    }

    const videoUrl =
      `/uploads/homepage-popup/${file.filename}`;

    const data =
      await updateHomepagePopupVideo(
        videoUrl
      );

    return res.status(200).json({
      success: true,
      message:
        "Homepage popup video updated successfully.",
      data,
    });
  } catch (error) {
    console.error(
      "Upload homepage popup video error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to upload homepage popup video";

    const status =
      message.includes("not found") ||
      message.includes("Not found")
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}