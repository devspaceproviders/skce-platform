import type { Request, Response } from "express";

import {
  getTrainerActivityHistory,
} from "../services/trainer-activity.service";

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

export async function getTrainerActivityController(
  req: Request,
  res: Response
) {
  const trainerId = parseId(req.params.id);

  if (!trainerId) {
    return res.status(400).json({
      success: false,
      message: "Invalid trainer ID",
    });
  }

  try {
    const activities =
      await getTrainerActivityHistory(
        trainerId
      );

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error(
      "Failed to load trainer activity:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load trainer activity",
    });
  }
}