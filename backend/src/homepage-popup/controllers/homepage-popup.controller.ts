import type { Request, Response } from "express";

import {
  getHomepagePopup,
} from "../services/homepage-popup.service";

export async function getPublicHomepagePopup(
  _req: Request,
  res: Response
) {
  try {
    const popup =
      await getHomepagePopup();

    return res.status(200).json({
      success: true,
      data: popup,
    });
  } catch (error) {
    console.error(
      "Get homepage popup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve homepage popup",
    });
  }
}