import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../../auth/middleware/auth.middleware";

import {
  listPublicTrainers,
  createAdminTrainer,
  getAdminTrainer,
  listAdminTrainers,
  resetAdminTrainerPassword,
  updateAdminTrainer,
  type TrainerCreateInput,
  type TrainerUpdateInput,
} from "../services/trainer.service";

import {
  updateTrainerProfilePhoto,
} from "../services/trainer-photo.service";

function parseId(
  value: string | string[] | undefined
) {
  if (!value) {
    throw new Error(
      "Trainer ID is required."
    );
  }

  const idValue =
    Array.isArray(value)
      ? value[0]
      : value;

  const id = Number(idValue);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid trainer ID."
    );
  }

  return id;
}

/*
 * ============================================================
 * PUBLIC - LIST TRAINERS
 * ============================================================
 */

export async function listPublicTrainersController(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const trainers =
      await listPublicTrainers();

    return res.status(200).json({
      success: true,
      data: trainers,
    });
  } catch (error) {
    console.error(
      "List public trainers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load trainers.",
    });
  }
}

/*
 * ============================================================
 * ADMIN - LIST TRAINERS
 * ============================================================
 */

export async function listAdminTrainersController(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const trainers =
      await listAdminTrainers();

    return res.status(200).json({
      success: true,
      data: trainers,
    });
  } catch (error) {
    console.error(
      "List trainers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load trainers.",
    });
  }
}

/*
 * ============================================================
 * ADMIN - GET TRAINER
 * ============================================================
 */

export async function getAdminTrainerController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const trainer =
      await getAdminTrainer(
        parseId(req.params.id)
      );

    return res.status(200).json({
      success: true,
      data: trainer,
    });
  } catch (error) {
    console.error(
      "Get trainer error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load trainer.";

    const status =
      message === "Trainer not found." ||
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

/*
 * ============================================================
 * ADMIN - CREATE TRAINER
 * ============================================================
 */

export async function createAdminTrainerController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const body =
      req.body || {};

    if (
      typeof body.name !==
        "string" ||
      typeof body.email !==
        "string" ||
      typeof body.password !==
        "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    const input: TrainerCreateInput = {
      name: body.name,

      email: body.email,

      phone:
        body.phone === undefined
          ? null
          : body.phone,

      specialization:
        body.specialization ===
        undefined
          ? null
          : body.specialization,

      experience:
        body.experience ===
          undefined ||
        body.experience === null
          ? null
          : Number(
              body.experience
            ),

      password:
        body.password,

      isActive:
        body.isActive ===
        undefined
          ? true
          : Boolean(
              body.isActive
            ),
    };

    const trainer =
      await createAdminTrainer(
        input
      );

    return res.status(201).json({
      success: true,
      message:
        "Trainer created successfully.",
      data: trainer,
    });
  } catch (error) {
    console.error(
      "Create trainer error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create trainer.";

    const status =
      message.includes(
        "already exists"
      )
        ? 409
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/*
 * ============================================================
 * ADMIN - UPDATE TRAINER
 * ============================================================
 */

export async function updateAdminTrainerController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const body =
      req.body || {};

    const input: TrainerUpdateInput =
      {};

    if (
      body.name !== undefined
    ) {
      input.name =
        body.name;
    }

    if (
      body.email !== undefined
    ) {
      input.email =
        body.email;
    }

    if (
      body.phone !== undefined
    ) {
      input.phone =
        body.phone;
    }

    if (
      body.specialization !==
      undefined
    ) {
      input.specialization =
        body.specialization;
    }

    if (
      body.experience !==
      undefined
    ) {
      input.experience =
        body.experience ===
          null ||
        body.experience ===
          ""
          ? null
          : Number(
              body.experience
            );
    }

    if (
      body.password !==
      undefined
    ) {
      input.password =
        body.password;
    }

    if (
      body.isActive !==
      undefined
    ) {
      input.isActive =
        Boolean(
          body.isActive
        );
    }

    const trainer =
      await updateAdminTrainer(
        parseId(
          req.params.id
        ),
        input
      );

    return res.status(200).json({
      success: true,
      message:
        "Trainer updated successfully.",
      data: trainer,
    });
  } catch (error) {
    console.error(
      "Update trainer error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update trainer.";

    const status =
      message === "Trainer not found." ||
      message ===
        "Trainer account not found."
        ? 404
        : message.includes(
              "already exists"
            )
          ? 409
          : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/*
 * ============================================================
 * ADMIN - RESET TRAINER PASSWORD
 * ============================================================
 */

export async function resetAdminTrainerPasswordController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const password =
      req.body?.password;

    if (
      typeof password !==
      "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password is required.",
      });
    }

    await resetAdminTrainerPassword(
      parseId(
        req.params.id
      ),
      password
    );

    return res.status(200).json({
      success: true,
      message:
        "Trainer password updated successfully.",
    });
  } catch (error) {
    console.error(
      "Reset trainer password error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to reset trainer password.";

    const status =
      message === "Trainer not found." ||
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

/*
 * ============================================================
 * ADMIN - UPDATE TRAINER PROFILE PHOTO
 * ============================================================
 */

export async function updateAdminTrainerPhotoController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const file =
      req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message:
          "Profile photo is required.",
      });
    }

    const profilePhotoUrl =
      `/uploads/profile/${file.filename}`;

    const trainer =
      await updateTrainerProfilePhoto(
        parseId(
          req.params.id
        ),
        profilePhotoUrl
      );

    return res.status(200).json({
      success: true,
      message:
        "Trainer profile photo updated successfully.",
      data: trainer,
    });
  } catch (error) {
    console.error(
      "Update trainer profile photo error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update trainer profile photo.";

    const status =
      message === "Trainer not found." ||
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