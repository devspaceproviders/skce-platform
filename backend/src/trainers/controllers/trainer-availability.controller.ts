import type { Response } from "express";

import type { AuthenticatedRequest } from "../../auth/middleware/auth.middleware";

import {
  createTrainerAvailability,
  deleteTrainerAvailability,
  listTrainerAvailability,
  updateTrainerAvailability,
  type TrainerAvailabilityCreateInput,
  type TrainerAvailabilityDay,
  type TrainerAvailabilityUpdateInput,
} from "../services/trainer-availability.service";

function parseId(
  value: unknown,
  label: string
) {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  if (
    typeof rawValue !== "string" ||
    !rawValue.trim()
  ) {
    throw new Error(
      `${label} is required.`
    );
  }

  const id = Number(rawValue);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      `Invalid ${label}.`
    );
  }

  return id;
}

function parseOptionalBoolean(
  value: unknown
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(
    "isActive must be true or false."
  );
}

function parseOptionalMinute(
  value: unknown,
  label: string
) {
  if (value === undefined) {
    return undefined;
  }

  const minute =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(minute)
  ) {
    throw new Error(
      `${label} must be a whole number.`
    );
  }

  return minute;
}

/* ============================================================
   ADMIN - LIST TRAINER AVAILABILITY
   ============================================================ */

export async function listTrainerAvailabilityController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const trainerId =
      parseId(
        req.params.trainerId,
        "Trainer ID"
      );

    const availability =
      await listTrainerAvailability(
        trainerId
      );

    return res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error(
      "List trainer availability error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load trainer availability.";

    const status =
      message ===
        "Trainer not found." ||
      message ===
        "Trainer account not found."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/* ============================================================
   ADMIN - CREATE TRAINER AVAILABILITY
   ============================================================ */

export async function createTrainerAvailabilityController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const trainerId =
      parseId(
        req.params.trainerId,
        "Trainer ID"
      );

    const body =
      req.body || {};

    if (
      typeof body.dayOfWeek !==
      "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "dayOfWeek is required.",
      });
    }

    const startMinute =
      parseOptionalMinute(
        body.startMinute,
        "startMinute"
      );

    const endMinute =
      parseOptionalMinute(
        body.endMinute,
        "endMinute"
      );

    if (
      startMinute ===
        undefined ||
      endMinute ===
        undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "startMinute and endMinute are required.",
      });
    }

    const isActive =
      body.isActive !== undefined
        ? parseOptionalBoolean(
            body.isActive
          )
        : undefined;

    const input: TrainerAvailabilityCreateInput =
      {
        trainerId,
        dayOfWeek:
          body.dayOfWeek as TrainerAvailabilityDay,
        startMinute,
        endMinute,
        ...(body.timezone !==
        undefined
          ? {
              timezone:
                body.timezone,
            }
          : {}),
        ...(isActive !==
        undefined
          ? {
              isActive,
            }
          : {}),
      };

    const availability =
      await createTrainerAvailability(
        input
      );

    return res.status(201).json({
      success: true,
      message:
        "Trainer availability created successfully.",
      data: availability,
    });
  } catch (error) {
    console.error(
      "Create trainer availability error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create trainer availability.";

    const status =
      message ===
        "Trainer not found." ||
      message ===
        "Trainer account not found."
        ? 404
        : message.includes(
              "unique"
            )
          ? 409
          : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/* ============================================================
   ADMIN - UPDATE TRAINER AVAILABILITY
   ============================================================ */

export async function updateTrainerAvailabilityController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const availabilityId =
      parseId(
        req.params.id,
        "Availability ID"
      );

    const body =
      req.body || {};

    const input: TrainerAvailabilityUpdateInput =
      {};

    if (
      body.dayOfWeek !==
      undefined
    ) {
      if (
        typeof body.dayOfWeek !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "dayOfWeek must be a string.",
        });
      }

      input.dayOfWeek =
        body.dayOfWeek as TrainerAvailabilityDay;
    }

    if (
      body.startMinute !==
      undefined
    ) {
      const startMinute =
        parseOptionalMinute(
          body.startMinute,
          "startMinute"
        );

      if (
        startMinute !==
        undefined
      ) {
        input.startMinute =
          startMinute;
      }
    }

    if (
      body.endMinute !==
      undefined
    ) {
      const endMinute =
        parseOptionalMinute(
          body.endMinute,
          "endMinute"
        );

      if (
        endMinute !==
        undefined
      ) {
        input.endMinute =
          endMinute;
      }
    }

    if (
      body.timezone !==
      undefined
    ) {
      if (
        typeof body.timezone !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "timezone must be a string.",
        });
      }

      input.timezone =
        body.timezone;
    }

    if (
      body.isActive !==
      undefined
    ) {
      const isActive =
        parseOptionalBoolean(
          body.isActive
        );

      if (
        isActive !==
        undefined
      ) {
        input.isActive =
          isActive;
      }
    }

    const availability =
      await updateTrainerAvailability(
        availabilityId,
        input
      );

    return res.status(200).json({
      success: true,
      message:
        "Trainer availability updated successfully.",
      data: availability,
    });
  } catch (error) {
    console.error(
      "Update trainer availability error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update trainer availability.";

    const status =
      message ===
        "Availability slot not found."
        ? 404
        : message.includes(
              "unique"
            )
          ? 409
          : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/* ============================================================
   ADMIN - DELETE TRAINER AVAILABILITY
   ============================================================ */

export async function deleteTrainerAvailabilityController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const availabilityId =
      parseId(
        req.params.id,
        "Availability ID"
      );

    await deleteTrainerAvailability(
      availabilityId
    );

    return res.status(200).json({
      success: true,
      message:
        "Trainer availability deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete trainer availability error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete trainer availability.";

    const status =
      message ===
        "Availability slot not found."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}