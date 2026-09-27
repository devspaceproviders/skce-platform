import { db } from "../../prisma/db";

import {
  deleteAssignmentSubmissionFile,
  resolveAssignmentSubmissionFile,
  saveAssignmentSubmissionFile,
} from "./assessment-file.service";

type AssessmentType = "ASSIGNMENT" | "QUIZ";
type AssessmentSubmissionStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED";

type CreateAssessmentInput = {
  courseId: number;
  title: string;
  type: AssessmentType;
  description?: string;
  instructions?: string;
  dueAt?: string | null;
  totalMarks?: number;
  durationMinutes?: number | null;
  isActive?: boolean;
};

type UpdateAssessmentInput = {
  title?: string;
  type?: AssessmentType;
  description?: string | null;
  instructions?: string | null;
  dueAt?: string | null;
  totalMarks?: number;
  durationMinutes?: number | null;
  isActive?: boolean;
};

type AssessmentQuestionInput = {
  question: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer: string;
  marks?: number;
  sortOrder?: number;
};

type UpdateAssessmentQuestionInput = {
  question?: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer?: string;
  marks?: number;
  sortOrder?: number;
};

type SubmitAssignmentInput = {
  submissionFileName?: string | null;
  submissionFileUrl?: string | null;
  submissionComment?: string | null;
};

type SubmitQuizInput = {
  answers: Record<string, string>;
};


type AssessmentUserRole = "ADMIN" | "STUDENT" | "TRAINER";

async function getTrainerAssignedCourseIds(userId: number) {
  const trainerProfile = await db.orm.public.TrainerProfile.first({
    userId,
  });

  if (!trainerProfile) {
    throw new Error("Trainer profile not found");
  }

  const batches = await db.orm.public.Batch.all();
  const courseIds = new Set<number>();

  for (const batch of batches) {
    if (batch.trainerId === trainerProfile.id) {
      courseIds.add(batch.courseId);
    }
  }

  return courseIds;
}

async function assertAssessmentAccess(
  userId: number,
  role: AssessmentUserRole,
  courseId: number
) {
  if (role === "ADMIN") {
    return;
  }

  if (role !== "TRAINER") {
    throw new Error("Access denied for this assessment");
  }

  const courseIds = await getTrainerAssignedCourseIds(userId);

  if (!courseIds.has(courseId)) {
    throw new Error("Access denied for this assessment");
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateAssessmentType(type: string): type is AssessmentType {
  return type === "ASSIGNMENT" || type === "QUIZ";
}

function validateSubmissionStatus(
  status: string
): status is AssessmentSubmissionStatus {
  return (
    status === "IN_PROGRESS" ||
    status === "SUBMITTED" ||
    status === "GRADED"
  );
}

function normalizeCorrectAnswer(value: string): string {
  return value.trim().toUpperCase();
}

function validateCorrectAnswer(
  value: string,
  options: {
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
  }
) {
  const answer = normalizeCorrectAnswer(value);

  if (!["A", "B", "C", "D"].includes(answer)) {
    throw new Error(
      "Correct answer must be A, B, C or D"
    );
  }

  const optionMap: Record<string, string> = {
    A: normalizeText(options.optionA),
    B: normalizeText(options.optionB),
    C: normalizeText(options.optionC),
    D: normalizeText(options.optionD),
  };

  if (!optionMap[answer]) {
    throw new Error(
      `Option ${answer} is required when it is the correct answer`
    );
  }

  return answer;
}

async function getAssessment(assessmentId: number) {
  const assessment = await db.orm.public.Assessment.first({
    id: assessmentId,
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  return assessment;
}

async function getCourse(courseId: number) {
  const course = await db.orm.public.Course.first({
    id: courseId,
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return course;
}

async function getStudentAccessibleCourseIds(userId: number) {
  const enrollments =
    await db.orm.public.Enrollment.all();
  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const courseIds = new Set<number>();

  for (const enrollment of enrollments) {
    if (enrollment.userId !== userId) {
      continue;
    }

    if (
      enrollment.status !== "ACTIVE" &&
      enrollment.status !== "COMPLETED"
    ) {
      continue;
    }

    if (enrollment.courseId) {
      courseIds.add(enrollment.courseId);
    }

    if (enrollment.packageId) {
      const packageItems = packageCourses.filter(
        (item) => item.packageId === enrollment.packageId
      );

      for (const packageItem of packageItems) {
        courseIds.add(packageItem.courseId);
      }
    }
  }

  return courseIds;
}

function getLatestSubmission(
  submissions: Array<any>,
  assessmentId: number
) {
  return submissions
    .filter(
      (submission) =>
        submission.assessmentId === assessmentId
    )
    .sort(
      (a, b) =>
        b.attemptNumber - a.attemptNumber ||
        new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
    )[0] ?? null;
}

function mapStudentSubmission(submission: any) {
  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    attemptNumber: submission.attemptNumber,
    submissionFileName:
      submission.submissionFileName,
    submissionFileUrl:
      submission.submissionFileUrl,
    submissionComment:
      submission.submissionComment,
    score: submission.score,
    status: submission.status,
    feedback: submission.feedback,
    startedAt: submission.startedAt,
    submittedAt: submission.submittedAt,
    gradedAt: submission.gradedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function mapQuestionForStudent(question: any) {
  return {
    id: question.id,
    assessmentId: question.assessmentId,
    question: question.question,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    marks: question.marks,
    sortOrder: question.sortOrder,
  };
}

/*
 * ============================================================
 * STUDENT ASSESSMENT APIs
 * ============================================================
 */

export async function getStudentAssessments(
  userId: number
) {
  const courseIds =
    await getStudentAccessibleCourseIds(userId);

  if (courseIds.size === 0) {
    return [];
  }

  const assessments =
    await db.orm.public.Assessment.all();
  const courses =
    await db.orm.public.Course.all();
  const submissions =
    (await db.orm.public.AssessmentSubmission.all())
      .filter((submission) => submission.userId === userId);
  const questions =
    await db.orm.public.AssessmentQuestion.all();

  return assessments
    .filter(
      (assessment) =>
        assessment.isActive &&
        courseIds.has(assessment.courseId)
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .map((assessment) => {
      const course = courses.find(
        (item) => item.id === assessment.courseId
      );
      const latestSubmission = getLatestSubmission(
        submissions,
        assessment.id
      );

      return {
        id: assessment.id,
        courseId: assessment.courseId,
        courseTitle: course?.title ?? "",
        title: assessment.title,
        type: assessment.type,
        description: assessment.description,
        instructions: assessment.instructions,
        dueAt: assessment.dueAt,
        totalMarks: assessment.totalMarks,
        durationMinutes: assessment.durationMinutes,
        isActive: assessment.isActive,
        questionCount: questions.filter(
          (question) =>
            question.assessmentId === assessment.id
        ).length,
        latestSubmission:
          mapStudentSubmission(latestSubmission),
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      };
    });
}

export async function getStudentAssessmentById(
  userId: number,
  assessmentId: number
) {
  const assessment = await getAssessment(assessmentId);
  const courseIds =
    await getStudentAccessibleCourseIds(userId);

  if (!courseIds.has(assessment.courseId)) {
    throw new Error("Access denied for this assessment");
  }

  if (!assessment.isActive) {
    throw new Error("Assessment not found");
  }

  const course = await getCourse(assessment.courseId);
  const questions =
    await db.orm.public.AssessmentQuestion.all();
  const submissions =
    (await db.orm.public.AssessmentSubmission.all())
      .filter((submission) => submission.userId === userId);

  const latestSubmission = getLatestSubmission(
    submissions,
    assessment.id
  );

  return {
    id: assessment.id,
    courseId: assessment.courseId,
    courseTitle: course.title,
    title: assessment.title,
    type: assessment.type,
    description: assessment.description,
    instructions: assessment.instructions,
    dueAt: assessment.dueAt,
    totalMarks: assessment.totalMarks,
    durationMinutes: assessment.durationMinutes,
    isActive: assessment.isActive,
    questions:
      assessment.type === "QUIZ"
        ? questions
            .filter(
              (question) =>
                question.assessmentId === assessment.id
            )
            .sort(
              (a, b) => a.sortOrder - b.sortOrder
            )
            .map(mapQuestionForStudent)
        : [],
    latestSubmission:
      mapStudentSubmission(latestSubmission),
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  };
}

async function getNextAttemptNumber(
  assessmentId: number,
  userId: number
) {
  const submissions =
    await db.orm.public.AssessmentSubmission.all();

  const userSubmissions = submissions.filter(
    (submission) =>
      submission.assessmentId === assessmentId &&
      submission.userId === userId
  );

  return (
    userSubmissions.reduce(
      (max, submission) =>
        Math.max(max, submission.attemptNumber),
      0
    ) + 1
  );
}

export async function submitAssignment(
  userId: number,
  assessmentId: number,
  input: SubmitAssignmentInput,
  file: Express.Multer.File
) {
  const assessment = await getAssessment(assessmentId);
  const courseIds = await getStudentAccessibleCourseIds(userId);

  if (!courseIds.has(assessment.courseId)) {
    throw new Error("Access denied for this assessment");
  }

  if (!assessment.isActive) {
    throw new Error("Assessment not found");
  }

  if (assessment.type !== "ASSIGNMENT") {
    throw new Error("Assessment is not an assignment");
  }

  if (!file) {
    throw new Error("Assignment file is required");
  }

  const attemptNumber = await getNextAttemptNumber(
    assessmentId,
    userId
  );
  const now = new Date().toISOString();

  const submission = await db.orm.public.AssessmentSubmission.create({
    assessmentId,
    userId,
    attemptNumber,
    answers: null,
    submissionFileName: file.originalname,
    submissionFileUrl: null,
    submissionComment: normalizeText(input.submissionComment) || null,
    score: null,
    status: "SUBMITTED",
    feedback: null,
    startedAt: now,
    submittedAt: now,
    gradedAt: null,
  });

  try {
    const stored = await saveAssignmentSubmissionFile(
      submission.id,
      file
    );

    return db.orm.public.AssessmentSubmission
      .where({ id: submission.id })
      .update({
        submissionFileName: file.originalname,
        submissionFileUrl: stored.downloadUrl,
      });
  } catch (error) {
    await db.orm.public.AssessmentSubmission
      .where({ id: submission.id })
      .delete();

    throw error;
  }
}

export async function submitQuiz(
  userId: number,
  assessmentId: number,
  input: SubmitQuizInput
) {
  const assessment = await getAssessment(assessmentId);
  const courseIds =
    await getStudentAccessibleCourseIds(userId);

  if (!courseIds.has(assessment.courseId)) {
    throw new Error("Access denied for this assessment");
  }

  if (!assessment.isActive) {
    throw new Error("Assessment not found");
  }

  if (assessment.type !== "QUIZ") {
    throw new Error("Assessment is not a quiz");
  }

  const questions =
    await db.orm.public.AssessmentQuestion.all();
  const quizQuestions = questions
    .filter(
      (question) =>
        question.assessmentId === assessmentId
    )
    .sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

  if (quizQuestions.length === 0) {
    throw new Error(
      "This quiz does not have any questions yet"
    );
  }

  const answers = input.answers ?? {};
  const allowedQuestionIds = new Set(
    quizQuestions.map((question) => String(question.id))
  );

  for (const questionId of Object.keys(answers)) {
    if (!allowedQuestionIds.has(String(questionId))) {
      throw new Error(
        "One or more submitted answers do not belong to this quiz"
      );
    }
  }

  let score = 0;

  for (const question of quizQuestions) {
    if (!question.correctAnswer) {
      throw new Error(
        "This quiz contains a question without a correct answer"
      );
    }

    const answer = normalizeCorrectAnswer(
      String(answers[String(question.id)] ?? "")
    );
    const correctAnswer = normalizeCorrectAnswer(
      question.correctAnswer
    );

    if (
      answer &&
      answer === correctAnswer
    ) {
      score += question.marks;
    }
  }

  if (score > assessment.totalMarks) {
    score = assessment.totalMarks;
  }

  const attemptNumber = await getNextAttemptNumber(
    assessmentId,
    userId
  );
  const now = new Date().toISOString();

  const submission =
    await db.orm.public.AssessmentSubmission.create({
      assessmentId,
      userId,
      attemptNumber,
      answers: JSON.stringify(answers),
      submissionFileName: null,
      submissionFileUrl: null,
      submissionComment: null,
      score,
      status: "SUBMITTED",
      feedback: null,
      startedAt: now,
      submittedAt: now,
      gradedAt: null,
    });

  return {
    submission: {
      id: submission.id,
      assessmentId: submission.assessmentId,
      attemptNumber: submission.attemptNumber,
      score: submission.score,
      status: submission.status,
      submittedAt: submission.submittedAt,
    },
    totalMarks: assessment.totalMarks,
    questionCount: quizQuestions.length,
  };
}

/*
 * ============================================================
 * TRAINER / ADMIN ASSESSMENT APIs
 * ============================================================
 */

export async function getTrainerAssessments(
  userId: number,
  role: AssessmentUserRole,
  courseId?: number
) {
  const assignedCourseIds =
    role === "ADMIN"
      ? null
      : await getTrainerAssignedCourseIds(userId);

  if (role !== "ADMIN" && role !== "TRAINER") {
    throw new Error("Access denied for this assessment");
  }

  if (
    courseId !== undefined &&
    assignedCourseIds !== null &&
    !assignedCourseIds.has(courseId)
  ) {
    throw new Error("Access denied for this assessment");
  }

  const assessments =
    await db.orm.public.Assessment.all();
  const courses =
    await db.orm.public.Course.all();
  const questions =
    await db.orm.public.AssessmentQuestion.all();
  const submissions =
    await db.orm.public.AssessmentSubmission.all();

  return assessments
    .filter(
      (assessment) =>
        (courseId === undefined ||
          assessment.courseId === courseId) &&
        (assignedCourseIds === null ||
          assignedCourseIds.has(assessment.courseId))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .map((assessment) => {
      const course = courses.find(
        (item) => item.id === assessment.courseId
      );

      return {
        id: assessment.id,
        courseId: assessment.courseId,
        courseTitle: course?.title ?? "",
        title: assessment.title,
        type: assessment.type,
        description: assessment.description,
        instructions: assessment.instructions,
        dueAt: assessment.dueAt,
        totalMarks: assessment.totalMarks,
        durationMinutes: assessment.durationMinutes,
        isActive: assessment.isActive,
        questionCount: questions.filter(
          (question) =>
            question.assessmentId === assessment.id
        ).length,
        submissionCount: submissions.filter(
          (submission) =>
            submission.assessmentId === assessment.id
        ).length,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      };
    });
}

export async function getTrainerAssessmentById(
  userId: number,
  role: AssessmentUserRole,
  assessmentId: number
) {
  const assessment = await getAssessment(assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);
  const course = await getCourse(assessment.courseId);
  const questions =
    await db.orm.public.AssessmentQuestion.all();
  const submissions =
    await db.orm.public.AssessmentSubmission.all();

  return {
    ...assessment,
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      isActive: course.isActive,
    },
    questions: questions
      .filter(
        (question) =>
          question.assessmentId === assessment.id
      )
      .sort(
        (a, b) => a.sortOrder - b.sortOrder
      ),
    submissionCount: submissions.filter(
      (submission) =>
        submission.assessmentId === assessment.id
    ).length,
  };
}

export async function createAssessment(
  userId: number,
  role: AssessmentUserRole,
  input: CreateAssessmentInput
) {
  await getCourse(input.courseId);
  await assertAssessmentAccess(userId, role, input.courseId);

  const title = normalizeText(input.title);

  if (!title) {
    throw new Error("Assessment title is required");
  }

  if (!validateAssessmentType(input.type)) {
    throw new Error(
      "Assessment type must be ASSIGNMENT or QUIZ"
    );
  }

  const totalMarks =
    input.totalMarks === undefined
      ? 100
      : Math.trunc(input.totalMarks);

  if (!Number.isInteger(totalMarks) || totalMarks <= 0) {
    throw new Error(
      "Total marks must be a positive integer"
    );
  }

  if (
    input.durationMinutes !== undefined &&
    input.durationMinutes !== null &&
    (!Number.isInteger(input.durationMinutes) ||
      input.durationMinutes <= 0)
  ) {
    throw new Error(
      "Duration must be a positive integer in minutes"
    );
  }

  return db.orm.public.Assessment.create({
    courseId: input.courseId,
    title,
    type: input.type,
    description:
      normalizeText(input.description) || null,
    instructions:
      normalizeText(input.instructions) || null,
    dueAt: input.dueAt || null,
    totalMarks,
    durationMinutes:
      input.durationMinutes ?? null,
    isActive:
      input.isActive === undefined
        ? true
        : input.isActive,
  });
}

export async function updateAssessment(
  userId: number,
  role: AssessmentUserRole,
  assessmentId: number,
  input: UpdateAssessmentInput
) {
  const assessment = await getAssessment(assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);
  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = normalizeText(input.title);

    if (!title) {
      throw new Error("Assessment title is required");
    }

    updateData.title = title;
  }

  if (input.type !== undefined) {
    if (!validateAssessmentType(input.type)) {
      throw new Error(
        "Assessment type must be ASSIGNMENT or QUIZ"
      );
    }

    updateData.type = input.type;
  }

  if (input.description !== undefined) {
    updateData.description =
      normalizeText(input.description) || null;
  }

  if (input.instructions !== undefined) {
    updateData.instructions =
      normalizeText(input.instructions) || null;
  }

  if (input.dueAt !== undefined) {
    updateData.dueAt = input.dueAt || null;
  }

  if (input.totalMarks !== undefined) {
    const totalMarks = Math.trunc(input.totalMarks);

    if (!Number.isInteger(totalMarks) || totalMarks <= 0) {
      throw new Error(
        "Total marks must be a positive integer"
      );
    }

    updateData.totalMarks = totalMarks;
  }

  if (input.durationMinutes !== undefined) {
    if (
      input.durationMinutes !== null &&
      (!Number.isInteger(input.durationMinutes) ||
        input.durationMinutes <= 0)
    ) {
      throw new Error(
        "Duration must be a positive integer in minutes"
      );
    }

    updateData.durationMinutes =
      input.durationMinutes;
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return assessment;
  }

  return db.orm.public.Assessment
    .where({ id: assessmentId })
    .update(updateData);
}

export async function deleteAssessment(
  userId: number,
  role: AssessmentUserRole,
  assessmentId: number
) {
  const assessment = await getAssessment(assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);

  return db.orm.public.Assessment
    .where({ id: assessmentId })
    .delete();
}

export async function createAssessmentQuestion(
  userId: number,
  role: AssessmentUserRole,
  assessmentId: number,
  input: AssessmentQuestionInput
) {
  const assessment = await getAssessment(assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);

  if (assessment.type !== "QUIZ") {
    throw new Error(
      "Questions can only be added to a QUIZ assessment"
    );
  }

  const question = normalizeText(input.question);

  if (!question) {
    throw new Error("Question text is required");
  }

  const marks =
    input.marks === undefined
      ? 1
      : Math.trunc(input.marks);

  if (!Number.isInteger(marks) || marks <= 0) {
    throw new Error("Question marks must be a positive integer");
  }

  const correctAnswer = validateCorrectAnswer(
    input.correctAnswer,
    input
  );

  const sortOrder =
    input.sortOrder === undefined
      ? 0
      : Math.trunc(input.sortOrder);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error(
      "Sort order must be a non-negative integer"
    );
  }

  return db.orm.public.AssessmentQuestion.create({
    assessmentId,
    question,
    optionA: normalizeText(input.optionA) || null,
    optionB: normalizeText(input.optionB) || null,
    optionC: normalizeText(input.optionC) || null,
    optionD: normalizeText(input.optionD) || null,
    correctAnswer,
    marks,
    sortOrder,
  });
}

export async function updateAssessmentQuestion(
  userId: number,
  role: AssessmentUserRole,
  questionId: number,
  input: UpdateAssessmentQuestionInput
) {
  const questions =
    await db.orm.public.AssessmentQuestion.all();
  const question = questions.find(
    (item) => item.id === questionId
  );

  if (!question) {
    throw new Error("Assessment question not found");
  }

  const assessment = await getAssessment(question.assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);

  const updateData: Record<string, unknown> = {};

  const merged = {
    question:
      input.question !== undefined
        ? input.question
        : question.question,
    optionA:
      input.optionA !== undefined
        ? input.optionA
        : question.optionA,
    optionB:
      input.optionB !== undefined
        ? input.optionB
        : question.optionB,
    optionC:
      input.optionC !== undefined
        ? input.optionC
        : question.optionC,
    optionD:
      input.optionD !== undefined
        ? input.optionD
        : question.optionD,
    correctAnswer:
      input.correctAnswer !== undefined
        ? input.correctAnswer
        : question.correctAnswer ?? "",
  };

  const normalizedQuestion =
    normalizeText(merged.question);

  if (!normalizedQuestion) {
    throw new Error("Question text is required");
  }

  const correctAnswer = validateCorrectAnswer(
    merged.correctAnswer,
    merged
  );

  if (input.question !== undefined) {
    updateData.question = normalizedQuestion;
  }

  if (input.optionA !== undefined) {
    updateData.optionA =
      normalizeText(input.optionA) || null;
  }

  if (input.optionB !== undefined) {
    updateData.optionB =
      normalizeText(input.optionB) || null;
  }

  if (input.optionC !== undefined) {
    updateData.optionC =
      normalizeText(input.optionC) || null;
  }

  if (input.optionD !== undefined) {
    updateData.optionD =
      normalizeText(input.optionD) || null;
  }

  if (input.correctAnswer !== undefined) {
    updateData.correctAnswer = correctAnswer;
  }

  if (input.marks !== undefined) {
    const marks = Math.trunc(input.marks);

    if (!Number.isInteger(marks) || marks <= 0) {
      throw new Error(
        "Question marks must be a positive integer"
      );
    }

    updateData.marks = marks;
  }

  if (input.sortOrder !== undefined) {
    const sortOrder = Math.trunc(input.sortOrder);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new Error(
        "Sort order must be a non-negative integer"
      );
    }

    updateData.sortOrder = sortOrder;
  }

  // Keep the correct answer valid if option values changed.
  updateData.correctAnswer = correctAnswer;

  return db.orm.public.AssessmentQuestion
    .where({ id: questionId })
    .update(updateData);
}

export async function deleteAssessmentQuestion(
  userId: number,
  role: AssessmentUserRole,
  questionId: number
) {
  const questions =
    await db.orm.public.AssessmentQuestion.all();
  const question = questions.find(
    (item) => item.id === questionId
  );

  if (!question) {
    throw new Error("Assessment question not found");
  }

  const assessment = await getAssessment(question.assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);

  return db.orm.public.AssessmentQuestion
    .where({ id: questionId })
    .delete();
}

export async function getAssessmentSubmissions(
  userId: number,
  role: AssessmentUserRole,
  assessmentId: number
) {
  const assessment = await getAssessment(assessmentId);
  await assertAssessmentAccess(userId, role, assessment.courseId);

  const submissions =
    await db.orm.public.AssessmentSubmission.all();
  const users = await db.orm.public.User.all();
  const profiles =
    await db.orm.public.StudentProfile.all();

  return submissions
    .filter(
      (submission) =>
        submission.assessmentId === assessmentId
    )
    .sort(
      (a, b) =>
        new Date(b.submittedAt ?? b.createdAt).getTime() -
        new Date(a.submittedAt ?? a.createdAt).getTime()
    )
    .map((submission) => {
      const user = users.find(
        (item) => item.id === submission.userId
      );
      const profile = profiles.find(
        (item) => item.userId === submission.userId
      );

      return {
        id: submission.id,
        assessmentId: submission.assessmentId,
        userId: submission.userId,
        studentId: profile?.studentId ?? "",
        studentName: user?.name ?? "",
        studentEmail: user?.email ?? "",
        attemptNumber: submission.attemptNumber,
        answers: submission.answers,
        submissionFileName:
          submission.submissionFileName,
        submissionFileUrl:
          submission.submissionFileUrl,
        submissionComment:
          submission.submissionComment,
        score: submission.score,
        status: validateSubmissionStatus(
          submission.status
        )
          ? submission.status
          : "SUBMITTED",
        feedback: submission.feedback,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      };
    });
}

export async function getAssessmentSubmissionFile(
  userId: number,
  role: "ADMIN" | "STUDENT" | "TRAINER",
  submissionId: number,
  fileKey: string
) {
  const submissions = await db.orm.public.AssessmentSubmission.all();
  const submission = submissions.find(
    (item) => item.id === submissionId
  );

  if (!submission) {
    throw new Error("Assessment submission not found");
  }

  if (role === "STUDENT" && submission.userId !== userId) {
    throw new Error("Access denied");
  }

  if (role === "TRAINER") {
    const assessment = await getAssessment(submission.assessmentId);
    await assertAssessmentAccess(userId, role, assessment.courseId);
  }

  if (!submission.submissionFileUrl) {
    throw new Error("Submission file not found");
  }

  const prefix = `/api/assessments/submissions/${submissionId}/file/`;
  if (!submission.submissionFileUrl.startsWith(prefix)) {
    throw new Error("Submission file not found");
  }

  const storedFileKey = decodeURIComponent(
    submission.submissionFileUrl.slice(prefix.length)
  );

  if (storedFileKey !== decodeURIComponent(fileKey)) {
    throw new Error("Submission file not found");
  }

  const filePath = await resolveAssignmentSubmissionFile(storedFileKey);

  return {
    filePath,
    fileName: submission.submissionFileName || storedFileKey,
  };
}

export async function gradeAssessmentSubmission(
  userId: number,
  role: AssessmentUserRole,
  submissionId: number,
  score: number,
  feedback?: string | null
) {
  const submissions =
    await db.orm.public.AssessmentSubmission.all();
  const submission = submissions.find(
    (item) => item.id === submissionId
  );

  if (!submission) {
    throw new Error("Assessment submission not found");
  }

  const assessment = await getAssessment(
    submission.assessmentId
  );
  await assertAssessmentAccess(userId, role, assessment.courseId);

  const normalizedScore = Math.trunc(score);

  if (
    !Number.isInteger(normalizedScore) ||
    normalizedScore < 0 ||
    normalizedScore > assessment.totalMarks
  ) {
    throw new Error(
      `Score must be between 0 and ${assessment.totalMarks}`
    );
  }

  const updated =
    await db.orm.public.AssessmentSubmission
      .where({ id: submissionId })
      .update({
        score: normalizedScore,
        status: "GRADED",
        feedback:
          normalizeText(feedback) || null,
        gradedAt: new Date().toISOString(),
      });

  return updated;
}
