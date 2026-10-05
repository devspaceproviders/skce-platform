import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  createMyFeedbackController,
  getAdminFeedbackController,
  getMyFeedbackController,
  getTestimonialsController,
  updateAdminFeedbackStatusController,
} from "../controllers/feedback.controller";

/* ============================================================
   PUBLIC TESTIMONIALS
   ============================================================ */

export const publicFeedbackRouter =
  Router();

publicFeedbackRouter.get(
  "/",
  getTestimonialsController
);

/* ============================================================
   STUDENT FEEDBACK
   ============================================================ */

export const studentFeedbackRouter =
  Router();

studentFeedbackRouter.use(
  authenticate,
  requireRole("STUDENT")
);

studentFeedbackRouter.get(
  "/",
  getMyFeedbackController
);

studentFeedbackRouter.post(
  "/",
  createMyFeedbackController
);

/* ============================================================
   ADMIN FEEDBACK
   ============================================================ */

export const adminFeedbackRouter =
  Router();

adminFeedbackRouter.use(
  authenticate,
  requireRole("ADMIN")
);

adminFeedbackRouter.get(
  "/",
  getAdminFeedbackController
);

adminFeedbackRouter.patch(
  "/:id/status",
  updateAdminFeedbackStatusController
);