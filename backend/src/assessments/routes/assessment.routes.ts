import { Router } from "express";

import {
  createAssessmentController,
  createAssessmentQuestionController,
  deleteAssessmentController,
  deleteAssessmentQuestionController,
  getAssessment,
  getAssessmentSubmissionsController,
  getAssessmentSubmissionFileController,
  getAssessments,
  gradeAssessmentSubmissionController,
  submitAssignmentController,
  submitQuizController,
  updateAssessmentController,
  updateAssessmentQuestionController,
} from "../controllers/assessment.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import { uploadAssignmentFile } from "../services/assessment-file.service";

const router = Router();

/*
 * ============================================================
 * AUTHENTICATED ASSESSMENTS
 * ============================================================
 *
 * Students can view and submit assessments.
 * Trainers can manage assessments and view submissions.
 * Admins can manage everything as well.
 */

router.use(authenticate);

router.get(
  "/",
  requireRole("STUDENT", "TRAINER", "ADMIN"),
  getAssessments
);

router.get(
  "/:id",
  requireRole("STUDENT", "TRAINER", "ADMIN"),
  getAssessment
);

/*
 * ============================================================
 * TRAINER / ADMIN ASSESSMENT MANAGEMENT
 * ============================================================
 */

router.post(
  "/",
  requireRole("TRAINER", "ADMIN"),
  createAssessmentController
);

router.patch(
  "/:id",
  requireRole("TRAINER", "ADMIN"),
  updateAssessmentController
);

router.delete(
  "/:id",
  requireRole("TRAINER", "ADMIN"),
  deleteAssessmentController
);

router.post(
  "/:id/questions",
  requireRole("TRAINER", "ADMIN"),
  createAssessmentQuestionController
);

router.patch(
  "/questions/:questionId",
  requireRole("TRAINER", "ADMIN"),
  updateAssessmentQuestionController
);

router.delete(
  "/questions/:questionId",
  requireRole("TRAINER", "ADMIN"),
  deleteAssessmentQuestionController
);

router.get(
  "/:id/submissions",
  requireRole("TRAINER", "ADMIN"),
  getAssessmentSubmissionsController
);

router.post(
  "/submissions/:submissionId/grade",
  requireRole("TRAINER", "ADMIN"),
  gradeAssessmentSubmissionController
);

/*
 * ============================================================
 * PROTECTED SUBMISSION FILE
 * ============================================================
 */

router.get(
  "/submissions/:submissionId/file/:fileKey",
  requireRole("STUDENT", "TRAINER", "ADMIN"),
  getAssessmentSubmissionFileController
);

/*
 * ============================================================
 * STUDENT SUBMISSIONS
 * ============================================================
 */

router.post(
  "/:id/assignment-submission",
  requireRole("STUDENT"),
  uploadAssignmentFile.single("file"),
  submitAssignmentController
);

router.post(
  "/:id/quiz-submission",
  requireRole("STUDENT"),
  submitQuizController
);

/*
 * ============================================================
 * ADMIN ROUTER
 *
 * Kept separately under /api/admin/assessments, matching the
 * existing course/package route pattern.
 *
 * The same controller/service functions are reused so there is
 * only one business-logic implementation.
 * ============================================================
 */

export const adminAssessmentRouter = Router();

adminAssessmentRouter.use(
  authenticate,
  requireRole("ADMIN")
);

adminAssessmentRouter.get(
  "/submissions/:submissionId/file/:fileKey",
  getAssessmentSubmissionFileController
);

adminAssessmentRouter.get(
  "/",
  getAssessments
);

adminAssessmentRouter.get(
  "/:id",
  getAssessment
);

adminAssessmentRouter.post(
  "/",
  createAssessmentController
);

adminAssessmentRouter.patch(
  "/:id",
  updateAssessmentController
);

adminAssessmentRouter.delete(
  "/:id",
  deleteAssessmentController
);

adminAssessmentRouter.post(
  "/:id/questions",
  createAssessmentQuestionController
);

adminAssessmentRouter.patch(
  "/questions/:questionId",
  updateAssessmentQuestionController
);

adminAssessmentRouter.delete(
  "/questions/:questionId",
  deleteAssessmentQuestionController
);

adminAssessmentRouter.get(
  "/:id/submissions",
  getAssessmentSubmissionsController
);

adminAssessmentRouter.post(
  "/submissions/:submissionId/grade",
  gradeAssessmentSubmissionController
);

export default router;
