import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../../auth/middleware/auth.middleware";

import {
  addStudentToBatch,
  createBatch,
  deleteBatch,
  getBatchById,
  getBatchOptions,
  getBatchStudents,
  getTrainerBatchById,
  getTrainerProfileId,
  listBatches,
  listTrainerBatches,
  removeStudentFromBatch,
  updateBatch,
} from "../services/batch.service";

function parseId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid ID");
  }

  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid ID"
    );
  }

  return id;
}

function parseOptionalNumber(
  value: unknown
) {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed
    )
  ) {
    throw new Error(
      "Value must be an integer"
    );
  }

  return parsed;
}

function parseBatchInput(
  body: any,
  partial = false
) {
  const result: Record<
    string,
    unknown
  > = {};

  if (
    !partial ||
    body.name !==
      undefined
  ) {
    result.name =
      typeof body.name ===
      "string"
        ? body.name
        : "";
  }

  if (
    !partial ||
    body.courseId !==
      undefined
  ) {
    result.courseId =
      parseOptionalNumber(
        body.courseId
      );
  }

  if (
    body.trainerId !==
    undefined
  ) {
    result.trainerId =
      parseOptionalNumber(
        body.trainerId
      );
  }

  if (
    !partial ||
    body.startDate !==
      undefined
  ) {
    result.startDate =
      typeof body.startDate ===
      "string"
        ? body.startDate
        : "";
  }

  if (
    !partial ||
    body.endDate !==
      undefined
  ) {
    result.endDate =
      typeof body.endDate ===
      "string"
        ? body.endDate
        : "";
  }

  if (
    body.mode !==
    undefined
  ) {
    result.mode =
      body.mode;
  }

  if (
    body.maxStudents !==
    undefined
  ) {
    result.maxStudents =
      parseOptionalNumber(
        body.maxStudents
      );
  }

  if (
    body.status !==
    undefined
  ) {
    result.status =
      body.status;
  }

  return result;
}

function sendError(
  res: Response,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Batch operation failed";

  const status =
    message ===
      "Access denied"
      ? 403
      : message.includes(
            "not found"
          ) ||
          message.includes(
            "Not found"
          )
        ? 404
        : 400;

  return res
    .status(status)
    .json({
      success: false,
      message,
    });
}

/*
 * ============================================================
 * ADMIN
 * ============================================================
 */

export async function listAdminBatchesController(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const data =
      await listBatches();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "List admin batches error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function getAdminBatchOptionsController(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const data =
      await getBatchOptions();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get batch options error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function getAdminBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const batchId =
      parseId(
        req.params.id
      );

    const data =
      await getBatchById(
        batchId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get admin batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function getAdminBatchStudentsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const batchId =
      parseId(
        req.params.id
      );

    const data =
      await getBatchStudents(
        batchId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get batch students error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function createAdminBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const input =
      parseBatchInput(
        req.body || {},
        false
      );

    if (
      input.courseId ===
        null ||
      input.courseId ===
        undefined
    ) {
      throw new Error(
        "Valid courseId is required"
      );
    }

    if (
      typeof input.maxStudents ===
        "number" &&
      input.maxStudents <= 0
    ) {
      throw new Error(
        "Maximum students must be positive"
      );
    }

    const data =
      await createBatch(
        input as any
      );

    return res
      .status(201)
      .json({
        success: true,
        data,
      });
  } catch (error) {
    console.error(
      "Create batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function updateAdminBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const batchId =
      parseId(
        req.params.id
      );

    const input =
      parseBatchInput(
        req.body || {},
        true
      );

    const data =
      await updateBatch(
        batchId,
        input as any
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Update batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function deleteAdminBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const batchId =
      parseId(
        req.params.id
      );

    const data =
      await deleteBatch(
        batchId
      );

    return res.json(
      data
    );
  } catch (error) {
    console.error(
      "Delete batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function addStudentToBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const batchId =
      parseId(
        req.params.id
      );

    const studentId =
      parseOptionalNumber(
        req.body?.studentId
      );

    if (
      !studentId ||
      studentId <= 0
    ) {
      throw new Error(
        "Valid studentId is required"
      );
    }

    const data =
      await addStudentToBatch(
        batchId,
        studentId
      );

    return res
      .status(201)
      .json({
        success: true,
        data,
      });
  } catch (error) {
    console.error(
      "Add student to batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function removeStudentFromBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const batchId =
      parseId(
        req.params.id
      );

    const studentId =
      parseId(
        req.params.studentId
      );

    const data =
      await removeStudentFromBatch(
        batchId,
        studentId
      );

    return res.json(
      data
    );
  } catch (error) {
    console.error(
      "Remove student from batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

/*
 * ============================================================
 * TRAINER
 * ============================================================
 */

export async function listTrainerBatchesController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const trainerId =
      await getTrainerProfileId(
        req.user.userId
      );

    const data =
      await listTrainerBatches(
        trainerId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "List trainer batches error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function getTrainerBatchController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const batchId =
      parseId(
        req.params.id
      );

    const trainerId =
      await getTrainerProfileId(
        req.user.userId
      );

    const data =
      await getTrainerBatchById(
        trainerId,
        batchId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get trainer batch error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

export async function getTrainerBatchStudentsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const batchId =
      parseId(
        req.params.id
      );

    const trainerId =
      await getTrainerProfileId(
        req.user.userId
      );

    await getTrainerBatchById(
      trainerId,
      batchId
    );

    const data =
      await getBatchStudents(
        batchId
      );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get trainer batch students error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}

