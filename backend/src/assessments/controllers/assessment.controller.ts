import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../auth/middleware/auth.middleware";

import {
  createAssessment,
  createAssessmentQuestion,
  deleteAssessment,
  deleteAssessmentQuestion,
  getAssessmentSubmissions,
  getStudentAssessmentById,
  getStudentAssessments,
  getTrainerAssessmentById,
  getTrainerAssessments,
  gradeAssessmentSubmission,
  getAssessmentSubmissionFile,
  submitAssignment,
  submitQuiz,
  updateAssessment,
  updateAssessmentQuestion,
} from "../services/assessment.service";

type UserRole = "ADMIN" | "STUDENT" | "TRAINER";

function getUser(req: Request): {
  userId: number;
  role: UserRole;
} {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

function parseOptionalDate(
  value: unknown
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function parseBoolean(
  value: unknown
): boolean | undefined {
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

  return undefined;
}

function parsePositiveNumber(
  value: unknown
): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.trunc(parsed);
}

function sendError(
  res: Response,
  error: unknown,
  fallback: string
) {
  const message =
    error instanceof Error
      ? error.message
      : fallback;

  if (message === "Authentication required") {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  if (
    message === "Access denied for this assessment" ||
    message === "Access denied"
  ) {
    return res.status(403).json({
      success: false,
      message,
    });
  }

  if (
    message === "Assessment not found" ||
    message === "Course not found" ||
    message === "Assessment submission not found" ||
    message === "Assessment question not found"
  ) {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  return res.status(400).json({
    success: false,
    message,
  });
}

/*
 * ============================================================
 * LIST ASSESSMENTS
 * ============================================================
 */

export async function getAssessments(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { userId, role } = getUser(req);

    if (role === "STUDENT") {
      const assessments =
        await getStudentAssessments(userId);

      return res.status(200).json({
        success: true,
        message:
          "Student assessments retrieved successfully",
        data: assessments,
      });
    }

    const rawCourseId = req.query.courseId;
    let courseId: number | undefined;

    if (rawCourseId !== undefined) {
      courseId = parsePositiveInt(rawCourseId) ?? undefined;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "Valid course ID is required",
        });
      }
    }

    const assessments =
      await getTrainerAssessments(
        userId,
        role,
        courseId
      );

    return res.status(200).json({
      success: true,
      message: "Assessments retrieved successfully",
      data: assessments,
    });
  } catch (error) {
    console.error("Get assessments error:", error);
    return sendError(
      res,
      error,
      "Unable to retrieve assessments"
    );
  }
}

/*
 * ============================================================
 * GET SINGLE ASSESSMENT
 * ============================================================
 */

export async function getAssessment(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    const { userId, role } = getUser(req);

    const assessment =
      role === "STUDENT"
        ? await getStudentAssessmentById(
            userId,
            assessmentId
          )
        : await getTrainerAssessmentById(
            userId,
            role,
            assessmentId
          );

    return res.status(200).json({
      success: true,
      message: "Assessment retrieved successfully",
      data: assessment,
    });
  } catch (error) {
    console.error("Get assessment error:", error);
    return sendError(
      res,
      error,
      "Unable to retrieve assessment"
    );
  }
}

/*
 * ============================================================
 * CREATE ASSESSMENT
 * ============================================================
 */

export async function createAssessmentController(
  req: Request,
  res: Response
) {
  try {
    const courseId = parsePositiveInt(
      req.body.courseId
    );

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Valid course ID is required",
      });
    }

    const title = optionalString(req.body.title);
    const type = optionalString(req.body.type);
    const assessmentTitle = title?.trim();

    if (!assessmentTitle) {
      return res.status(400).json({
        success: false,
        message: "Assessment title is required",
      });
    }

    if (type !== "ASSIGNMENT" && type !== "QUIZ") {
      return res.status(400).json({
        success: false,
        message:
          "Assessment type must be ASSIGNMENT or QUIZ",
      });
    }

    const rawTotalMarks = req.body.totalMarks;
    let totalMarks: number | undefined;

    if (rawTotalMarks !== undefined) {
      totalMarks = parsePositiveNumber(rawTotalMarks) ??
        undefined;

      if (!totalMarks) {
        return res.status(400).json({
          success: false,
          message:
            "Total marks must be a positive integer",
        });
      }
    }

    let durationMinutes:
      | number
      | null
      | undefined;

    if (req.body.durationMinutes !== undefined) {
      if (
        req.body.durationMinutes === null ||
        req.body.durationMinutes === ""
      ) {
        durationMinutes = null;
      } else {
        durationMinutes = parsePositiveNumber(
          req.body.durationMinutes
        );

        if (!durationMinutes) {
          return res.status(400).json({
            success: false,
            message:
              "Duration must be a positive integer in minutes",
          });
        }
      }
    }

    const dueAt = parseOptionalDate(
      req.body.dueAt
    );

    if (
      req.body.dueAt !== undefined &&
      dueAt === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "dueAt must be a valid date",
      });
    }

    const isActive = parseBoolean(
      req.body.isActive
    );

    if (
      req.body.isActive !== undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false",
      });
    }

    const description = nullableString(
      req.body.description
    );
    const instructions = nullableString(
      req.body.instructions
    );

    const assessmentInput: Parameters<
      typeof createAssessment
    >[2] = {
      courseId,
      title: assessmentTitle,
      type,
    };

    if (typeof description === "string") {
      assessmentInput.description = description;
    }

    if (typeof instructions === "string") {
      assessmentInput.instructions = instructions;
    }

    if (dueAt !== undefined) {
      assessmentInput.dueAt = dueAt;
    }

    if (totalMarks !== undefined) {
      assessmentInput.totalMarks = totalMarks;
    }

    if (durationMinutes !== undefined) {
      assessmentInput.durationMinutes =
        durationMinutes;
    }

    if (isActive !== undefined) {
      assessmentInput.isActive = isActive;
    }

    const { userId, role } = getUser(req);

    const assessment =
      await createAssessment(
        userId,
        role,
        assessmentInput
      );

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      data: assessment,
    });
  } catch (error) {
    console.error("Create assessment error:", error);
    return sendError(
      res,
      error,
      "Unable to create assessment"
    );
  }
}

/*
 * ============================================================
 * UPDATE ASSESSMENT
 * ============================================================
 */

export async function updateAssessmentController(
  req: Request,
  res: Response
) {
  try {
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    const title = optionalString(req.body.title);
    const type = optionalString(req.body.type);

    if (
      req.body.title !== undefined &&
      !title?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Assessment title cannot be empty",
      });
    }

    if (
      req.body.type !== undefined &&
      type !== "ASSIGNMENT" &&
      type !== "QUIZ"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Assessment type must be ASSIGNMENT or QUIZ",
      });
    }

    let totalMarks: number | undefined;

    if (req.body.totalMarks !== undefined) {
      totalMarks = parsePositiveNumber(
        req.body.totalMarks
      ) ?? undefined;

      if (!totalMarks) {
        return res.status(400).json({
          success: false,
          message:
            "Total marks must be a positive integer",
        });
      }
    }

    let durationMinutes:
      | number
      | null
      | undefined;

    if (req.body.durationMinutes !== undefined) {
      if (
        req.body.durationMinutes === null ||
        req.body.durationMinutes === ""
      ) {
        durationMinutes = null;
      } else {
        durationMinutes = parsePositiveNumber(
          req.body.durationMinutes
        );

        if (!durationMinutes) {
          return res.status(400).json({
            success: false,
            message:
              "Duration must be a positive integer in minutes",
          });
        }
      }
    }

    const dueAt = parseOptionalDate(
      req.body.dueAt
    );

    if (
      req.body.dueAt !== undefined &&
      dueAt === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "dueAt must be a valid date",
      });
    }

    const isActive = parseBoolean(
      req.body.isActive
    );

    if (
      req.body.isActive !== undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false",
      });
    }

    const updateInput: Parameters<
      typeof updateAssessment
    >[3] = {};

    if (title !== undefined) {
      updateInput.title = title.trim();
    }

    if (type !== undefined) {
      updateInput.type =
        type as "ASSIGNMENT" | "QUIZ";
    }

    const description = nullableString(
      req.body.description
    );
    if (description !== undefined) {
      updateInput.description = description;
    }

    const instructions = nullableString(
      req.body.instructions
    );
    if (instructions !== undefined) {
      updateInput.instructions = instructions;
    }

    if (dueAt !== undefined) {
      updateInput.dueAt = dueAt;
    }

    if (totalMarks !== undefined) {
      updateInput.totalMarks = totalMarks;
    }

    if (durationMinutes !== undefined) {
      updateInput.durationMinutes =
        durationMinutes;
    }

    if (isActive !== undefined) {
      updateInput.isActive = isActive;
    }

    const { userId, role } = getUser(req);

    const assessment =
      await updateAssessment(
        userId,
        role,
        assessmentId,
        updateInput
      );

    return res.status(200).json({
      success: true,
      message: "Assessment updated successfully",
      data: assessment,
    });
  } catch (error) {
    console.error("Update assessment error:", error);
    return sendError(
      res,
      error,
      "Unable to update assessment"
    );
  }
}

/*
 * ============================================================
 * DELETE ASSESSMENT
 * ============================================================
 */

export async function deleteAssessmentController(
  req: Request,
  res: Response
) {
  try {
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    const { userId, role } = getUser(req);

    await deleteAssessment(
      userId,
      role,
      assessmentId
    );

    return res.status(200).json({
      success: true,
      message: "Assessment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assessment error:", error);
    return sendError(
      res,
      error,
      "Unable to delete assessment"
    );
  }
}

/*
 * ============================================================
 * CREATE QUESTION
 * ============================================================
 */

export async function createAssessmentQuestionController(
  req: Request,
  res: Response
) {
  try {
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    const question = optionalString(
      req.body.question
    );
    const correctAnswer = optionalString(
      req.body.correctAnswer
    );

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question text is required",
      });
    }

    if (!correctAnswer?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Correct answer is required",
      });
    }

    let marks: number | undefined;

    if (req.body.marks !== undefined) {
      const parsedMarks = parsePositiveNumber(
        req.body.marks
      );

      if (parsedMarks === null) {
        return res.status(400).json({
          success: false,
          message:
            "Question marks must be a positive integer",
        });
      }

      marks = parsedMarks;
    }

    const sortOrder =
      req.body.sortOrder === undefined
        ? undefined
        : Number(req.body.sortOrder);

    if (
      sortOrder !== undefined &&
      (!Number.isInteger(sortOrder) ||
        sortOrder < 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sort order must be a non-negative integer",
      });
    }

    const questionInput: Parameters<
      typeof createAssessmentQuestion
    >[3] = {
      question: question.trim(),
      correctAnswer: correctAnswer.trim(),
    };

    const optionA = nullableString(
      req.body.optionA
    );
    const optionB = nullableString(
      req.body.optionB
    );
    const optionC = nullableString(
      req.body.optionC
    );
    const optionD = nullableString(
      req.body.optionD
    );

    if (optionA !== undefined) {
      questionInput.optionA = optionA;
    }

    if (optionB !== undefined) {
      questionInput.optionB = optionB;
    }

    if (optionC !== undefined) {
      questionInput.optionC = optionC;
    }

    if (optionD !== undefined) {
      questionInput.optionD = optionD;
    }

    if (marks !== undefined) {
      questionInput.marks = marks;
    }

    if (sortOrder !== undefined) {
      questionInput.sortOrder = sortOrder;
    }

    const result =
      await createAssessmentQuestion(
        getUser(req).userId,
        getUser(req).role,
        assessmentId,
        questionInput
      );

    return res.status(201).json({
      success: true,
      message: "Assessment question created successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Create assessment question error:",
      error
    );
    return sendError(
      res,
      error,
      "Unable to create assessment question"
    );
  }
}

/*
 * ============================================================
 * UPDATE QUESTION
 * ============================================================
 */

export async function updateAssessmentQuestionController(
  req: Request,
  res: Response
) {
  try {
    const questionId = parsePositiveInt(
      req.params.questionId
    );

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Valid question ID is required",
      });
    }

    let marks: number | undefined;

    if (req.body.marks !== undefined) {
      const parsedMarks = parsePositiveNumber(
        req.body.marks
      );

      if (parsedMarks === null) {
        return res.status(400).json({
          success: false,
          message:
            "Question marks must be a positive integer",
        });
      }

      marks = parsedMarks;
    }

    const sortOrder =
      req.body.sortOrder === undefined
        ? undefined
        : Number(req.body.sortOrder);

    if (
      sortOrder !== undefined &&
      (!Number.isInteger(sortOrder) ||
        sortOrder < 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sort order must be a non-negative integer",
      });
    }

    const questionInput: Parameters<
      typeof updateAssessmentQuestion
    >[3] = {};

    const questionText = optionalString(
      req.body.question
    );
    if (questionText !== undefined) {
      questionInput.question = questionText;
    }

    const optionA = nullableString(
      req.body.optionA
    );
    const optionB = nullableString(
      req.body.optionB
    );
    const optionC = nullableString(
      req.body.optionC
    );
    const optionD = nullableString(
      req.body.optionD
    );
    const correctAnswer = optionalString(
      req.body.correctAnswer
    );

    if (optionA !== undefined) {
      questionInput.optionA = optionA;
    }

    if (optionB !== undefined) {
      questionInput.optionB = optionB;
    }

    if (optionC !== undefined) {
      questionInput.optionC = optionC;
    }

    if (optionD !== undefined) {
      questionInput.optionD = optionD;
    }

    if (correctAnswer !== undefined) {
      questionInput.correctAnswer =
        correctAnswer;
    }

    if (marks !== undefined) {
      questionInput.marks = marks;
    }

    if (sortOrder !== undefined) {
      questionInput.sortOrder = sortOrder;
    }

    const result =
      await updateAssessmentQuestion(
        getUser(req).userId,
        getUser(req).role,
        questionId,
        questionInput
      );

    return res.status(200).json({
      success: true,
      message: "Assessment question updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Update assessment question error:",
      error
    );
    return sendError(
      res,
      error,
      "Unable to update assessment question"
    );
  }
}

/*
 * ============================================================
 * DELETE QUESTION
 * ============================================================
 */

export async function deleteAssessmentQuestionController(
  req: Request,
  res: Response
) {
  try {
    const questionId = parsePositiveInt(
      req.params.questionId
    );

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Valid question ID is required",
      });
    }

    const { userId, role } = getUser(req);

    await deleteAssessmentQuestion(
      userId,
      role,
      questionId
    );

    return res.status(200).json({
      success: true,
      message:
        "Assessment question deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete assessment question error:",
      error
    );
    return sendError(
      res,
      error,
      "Unable to delete assessment question"
    );
  }
}

/*
 * ============================================================
 * GET SUBMISSIONS
 * ============================================================
 */

export async function getAssessmentSubmissionsController(
  req: Request,
  res: Response
) {
  try {
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    const submissions =
      await getAssessmentSubmissions(
        getUser(req).userId,
        getUser(req).role,
        assessmentId
      );

    return res.status(200).json({
      success: true,
      message:
        "Assessment submissions retrieved successfully",
      data: submissions,
    });
  } catch (error) {
    console.error(
      "Get assessment submissions error:",
      error
    );
    return sendError(
      res,
      error,
      "Unable to retrieve assessment submissions"
    );
  }
}

/*
 * ============================================================
 * GRADE SUBMISSION
 * ============================================================
 */

export async function gradeAssessmentSubmissionController(
  req: Request,
  res: Response
) {
  try {
    const submissionId = parsePositiveInt(
      req.params.submissionId
    );

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: "Valid submission ID is required",
      });
    }

    if (req.body.score === undefined) {
      return res.status(400).json({
        success: false,
        message: "Score is required",
      });
    }

    const score = Number(req.body.score);

    if (!Number.isFinite(score) || score < 0) {
      return res.status(400).json({
        success: false,
        message: "Score must be a valid non-negative number",
      });
    }

    const result =
      await gradeAssessmentSubmission(
        getUser(req).userId,
        getUser(req).role,
        submissionId,
        Math.trunc(score),
        nullableString(req.body.feedback)
      );

    return res.status(200).json({
      success: true,
      message:
        "Assessment submission graded successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Grade assessment submission error:",
      error
    );
    return sendError(
      res,
      error,
      "Unable to grade assessment submission"
    );
  }
}

/*
 * ============================================================
 * STUDENT ASSIGNMENT SUBMISSION
 * ============================================================
 */

export async function submitAssignmentController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = getUser(req).userId;
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Assignment file is required",
      });
    }

    const submissionInput: Parameters<
      typeof submitAssignment
    >[2] = {
      submissionFileName: req.file.originalname,
      submissionFileUrl: null,
    };

    const submissionComment = nullableString(
      req.body.submissionComment
    );

    if (submissionComment !== undefined) {
      submissionInput.submissionComment =
        submissionComment;
    }

    const result = await submitAssignment(
      userId,
      assessmentId,
      submissionInput,
      req.file
    );

    return res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Submit assignment error:",
      error
    );
    return sendError(
      res,
      error,
      "Unable to submit assignment"
    );
  }
}

/*
 * ============================================================
 * GET PROTECTED SUBMISSION FILE
 * ============================================================
 */

export async function getAssessmentSubmissionFileController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { userId, role } = getUser(req);
    const submissionId = parsePositiveInt(
      req.params.submissionId
    );
    const rawFileKey = req.params.fileKey;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: "Valid submission ID is required",
      });
    }

    if (
      typeof rawFileKey !== "string" ||
      !rawFileKey.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Submission file is required",
      });
    }

    const fileKey = rawFileKey.trim();

    const file = await getAssessmentSubmissionFile(
      userId,
      role,
      submissionId,
      fileKey
    );

    const safeDownloadName = file.fileName.replace(
      /["\r\n]/g,
      "_"
    );

    return res.download(
      file.filePath,
      safeDownloadName,
      (error) => {
        if (error && !res.headersSent) {
          console.error(
            "Submission file download error:",
            error
          );

          res.status(404).json({
            success: false,
            message: "Submission file not found",
          });
        }
      }
    );
  } catch (error) {
    console.error(
      "Get submission file error:",
      error
    );

    return sendError(
      res,
      error,
      "Unable to retrieve submission file"
    );
  }
}

/*
 * ============================================================
 * STUDENT QUIZ SUBMISSION
 * ============================================================
 */

export async function submitQuizController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = getUser(req).userId;
    const assessmentId = parsePositiveInt(
      req.params.id
    );

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Valid assessment ID is required",
      });
    }

    if (
      !req.body.answers ||
      typeof req.body.answers !== "object" ||
      Array.isArray(req.body.answers)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "answers must be an object keyed by question ID",
      });
    }

    const answers: Record<string, string> = {};

    for (const [questionId, answer] of Object.entries(
      req.body.answers
    )) {
      if (typeof answer !== "string") {
        return res.status(400).json({
          success: false,
          message:
            `Answer for question ${questionId} must be a string`,
        });
      }

      answers[questionId] = answer;
    }

    const result = await submitQuiz(
      userId,
      assessmentId,
      { answers }
    );

    return res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return sendError(
      res,
      error,
      "Unable to submit quiz"
    );
  }
}
