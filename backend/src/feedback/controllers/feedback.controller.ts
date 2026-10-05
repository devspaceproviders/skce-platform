import type {
  Request,
  Response,
} from "express";

import {
  FeedbackError,
  createStudentFeedback,
  getAdminFeedback,
  getApprovedTestimonials,
  getStudentFeedback,
  updateFeedbackStatus,
} from "../services/feedback.service";

type AuthenticatedRequest = Request & {
  user?: {
    userId: number;
    role:
      | "ADMIN"
      | "STUDENT"
      | "TRAINER";
  };
};

function currentUser(
  req: AuthenticatedRequest
) {
  if (!req.user) {
    throw new FeedbackError(
      "Authentication required.",
      401
    );
  }

  return req.user;
}

function parsePositiveInt(
  value: unknown,
  fieldName: string
): number {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new FeedbackError(
      `${fieldName} must be a positive integer.`
    );
  }

  return parsed;
}

function sendError(
  res: Response,
  error: unknown
) {
  if (error instanceof FeedbackError) {
    return res
      .status(error.statusCode)
      .json({
        success: false,
        message: error.message,
      });
  }

  console.error(
    "Feedback controller error:",
    error
  );

  return res.status(500).json({
    success: false,
    message:
      "An unexpected error occurred.",
  });
}

/* ============================================================
   PUBLIC TESTIMONIALS
   ============================================================ */

export async function getTestimonialsController(
  _req: Request,
  res: Response
) {
  try {
    const testimonials =
      await getApprovedTestimonials();

    return res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

/* ============================================================
   STUDENT
   ============================================================ */

export async function getMyFeedbackController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);

    const data =
      await getStudentFeedback(
        user.userId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function createMyFeedbackController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);

    const feedback =
      await createStudentFeedback(
        user.userId,
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "Feedback submitted successfully. It will appear after admin approval.",
      data: feedback,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

/* ============================================================
   ADMIN
   ============================================================ */

export async function getAdminFeedbackController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    currentUser(req);

    const feedback =
      await getAdminFeedback();

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateAdminFeedbackStatusController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    currentUser(req);

    const feedbackId =
      parsePositiveInt(
        req.params.id,
        "Feedback ID"
      );

    const feedback =
      await updateFeedbackStatus(
        feedbackId,
        req.body?.status
      );

    return res.status(200).json({
      success: true,
      message:
        "Feedback status updated successfully.",
      data: feedback,
    });
  } catch (error) {
    return sendError(res, error);
  }
}