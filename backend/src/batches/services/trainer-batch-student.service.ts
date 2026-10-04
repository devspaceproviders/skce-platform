import { db } from "../../prisma/db";
import {
  getBatchStudents,
  getTrainerBatchById,
} from "./batch.service";
import { getStudentByStudentId } from "../../students/services/student.service";

function isActiveEnrollment(status: string) {
  return status !== "CANCELLED";
}

function latestSubmissionsByAssessment(
  submissions: any[]
) {
  const map = new Map<number, any>();

  for (const submission of submissions) {
    const current = map.get(submission.assessmentId);

    if (!current) {
      map.set(submission.assessmentId, submission);
      continue;
    }

    if (
      submission.attemptNumber > current.attemptNumber ||
      (submission.attemptNumber === current.attemptNumber &&
        new Date(submission.createdAt).getTime() >
          new Date(current.createdAt).getTime())
    ) {
      map.set(submission.assessmentId, submission);
    }
  }

  return map;
}

/**
 * Trainer-scoped student details.
 *
 * Security:
 * 1. Trainer must own the requested batch.
 * 2. Student profile must be assigned to that batch.
 *
 * Progress is calculated directly from the same PostgreSQL records used by
 * the student/admin views. Only courses for which this trainer has canTeach=true
 * are exposed, including their lesson/module, assessment and certificate data.
 */
export async function getTrainerBatchStudentDetails(
  trainerProfileId: number,
  batchId: number,
  studentProfileId: number
) {
  await getTrainerBatchById(trainerProfileId, batchId);

  const students = await getBatchStudents(batchId);

  const assignment = students.find(
    (item) =>
      item.studentId === studentProfileId &&
      item.student !== null
  );

  if (!assignment?.student) {
    throw new Error("Student is not assigned to this batch");
  }

  const publicStudentId = assignment.student.studentId;

  if (!publicStudentId) {
    throw new Error("Student ID is not available");
  }

  const student = await getStudentByStudentId(publicStudentId);

  if (!student) {
    throw new Error("Student not found");
  }

  // getStudentByStudentId() intentionally returns a public student
  // view and does not expose the internal User ID. Resolve the
  // StudentProfile here because lesson progress, submissions and
  // certificates are keyed by User ID.
  const studentProfile =
    await db.orm.public.StudentProfile
      .where({ id: studentProfileId })
      .first();

  if (!studentProfile) {
    throw new Error("Student profile not found");
  }

  const userId = studentProfile.userId;

  // Only courses for which this trainer currently has teaching
  // responsibility are exposed in the trainer student view.
  const trainerPermissions =
    await db.orm.public.TrainerCoursePermission
      .where({
        trainerId: trainerProfileId,
        canTeach: true,
      })
      .all();

  const trainerCourseIds = new Set(
    trainerPermissions.map((permission) => permission.courseId)
  );

  const enrollments = await db.orm.public.Enrollment
    .where({ studentId: studentProfileId })
    .all();

  const activeEnrollments = enrollments.filter((item) =>
    isActiveEnrollment(String(item.status))
  );

  const packageIds = Array.from(
    new Set(
      activeEnrollments
        .map((item) => item.packageId)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const directCourseIds = activeEnrollments
    .map((item) => item.courseId)
    .filter((id): id is number => typeof id === "number");

  const packageCourses = packageIds.length
    ? await db.orm.public.PackageCourse.all()
    : [];

  const courseIds = new Set<number>(directCourseIds);

  for (const item of packageCourses) {
    if (packageIds.includes(item.packageId)) {
      courseIds.add(item.courseId);
    }
  }

  const courseIdList = Array.from(courseIds).filter((courseId) =>
    trainerCourseIds.has(courseId)
  );

  const [
    courses,
    modules,
    lessons,
    lessonProgressRows,
    assessments,
    submissions,
    certificates,
  ] = await Promise.all([
    db.orm.public.Course.all(),
    db.orm.public.CourseModule.all(),
    db.orm.public.Lesson.all(),
    db.orm.public.LessonProgress.where({ userId }).all(),
    db.orm.public.Assessment.all(),
    db.orm.public.AssessmentSubmission.where({ userId }).all(),
    db.orm.public.Certificate.where({ userId }).all(),
  ]);

  const courseMap = new Map(
    courses
      .filter((course) => courseIdList.includes(course.id))
      .map((course) => [course.id, course])
  );

  const moduleRows = modules.filter(
    (module) =>
      courseIdList.includes(module.courseId) &&
      module.isActive
  );

  const lessonRows = lessons.filter(
    (lesson) =>
      moduleRows.some((module) => module.id === lesson.moduleId) &&
      lesson.isActive
  );

  const moduleCountByCourse = new Map<number, number>();
  for (const module of moduleRows) {
    moduleCountByCourse.set(
      module.courseId,
      (moduleCountByCourse.get(module.courseId) ?? 0) + 1
    );
  }

  const lessonIdsByCourse = new Map<number, Set<number>>();
  const moduleCourseMap = new Map(
    moduleRows.map((module) => [module.id, module.courseId])
  );

  for (const lesson of lessonRows) {
    const courseId = moduleCourseMap.get(lesson.moduleId);
    if (!courseId) continue;

    if (!lessonIdsByCourse.has(courseId)) {
      lessonIdsByCourse.set(courseId, new Set<number>());
    }

    lessonIdsByCourse.get(courseId)!.add(lesson.id);
  }

  const progressMap = new Map(
    lessonProgressRows.map((item) => [item.lessonId, item])
  );

  const assessmentsForStudent = assessments.filter(
    (assessment) =>
      courseIdList.includes(assessment.courseId) &&
      assessment.isActive
  );

  const latestSubmissionMap = latestSubmissionsByAssessment(submissions);

  const users = await db.orm.public.User.all();
  const userById = new Map(
    users.map((user: any) => [user.id, user])
  );

  const meetings = await db.orm.public.Meeting.all();
  const meetingParticipants =
    await db.orm.public.MeetingParticipant.all();

  const studentRelatedMeetingIds = new Set<number>();

  for (const meeting of meetings as any[]) {
    if (meeting.batchId === batchId) {
      studentRelatedMeetingIds.add(meeting.id);
    }
  }

  for (const participant of meetingParticipants as any[]) {
    if (participant.userId === userId) {
      studentRelatedMeetingIds.add(participant.meetingId);
    }
  }

  const meetingCourses = await db.orm.public.Course.all();
  const meetingBatches = await db.orm.public.Batch.all();

  const meetingCourseMap = new Map(
    meetingCourses.map((course: any) => [course.id, course])
  );
  const meetingBatchMap = new Map(
    meetingBatches.map((batch: any) => [batch.id, batch])
  );

  const courseProgress = courseIdList
    .map((courseId) => {
      const course = courseMap.get(courseId);
      if (!course) return null;

      const lessonIds = lessonIdsByCourse.get(courseId) ?? new Set<number>();
      const courseLessons = lessonRows.filter((lesson) =>
        lessonIds.has(lesson.id)
      );

      const completedLessons = courseLessons.filter(
        (lesson) =>
          progressMap.get(lesson.id)?.status === "COMPLETED"
      ).length;

      const startedLessons = courseLessons.filter((lesson) => {
        const status = progressMap.get(lesson.id)?.status;
        return status === "IN_PROGRESS" || status === "COMPLETED";
      }).length;

      const totalLessons = courseLessons.length;
      const remainingLessons = Math.max(
        totalLessons - completedLessons,
        0
      );

      const progressPercentage =
        totalLessons === 0
          ? 0
          : Math.round((completedLessons / totalLessons) * 100);

      const courseAssessments = assessmentsForStudent
        .filter((assessment) => assessment.courseId === courseId)
        .map((assessment) => {
          const submission = latestSubmissionMap.get(assessment.id);

          return {
            assessmentId: assessment.id,
            title: assessment.title,
            type: assessment.type,
            totalMarks: assessment.totalMarks,
            dueAt: assessment.dueAt,
            submissionStatus: submission?.status ?? null,
            score: submission?.score ?? null,
            submittedAt: submission?.submittedAt ?? null,
            createdByUserId: assessment.createdByUserId ?? null,
            createdByName: assessment.createdByUserId
              ? userById.get(assessment.createdByUserId)?.name ?? null
              : null,
            createdByRole: assessment.createdByUserId
              ? userById.get(assessment.createdByUserId)?.role ?? null
              : null,
          };
        });

      const courseModules = moduleRows
        .filter((module) => module.courseId === courseId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((module) => ({
          moduleId: module.id,
          moduleTitle: module.title,
          sortOrder: module.sortOrder,
          lessons: lessonRows
            .filter((lesson) => lesson.moduleId === module.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((lesson) => {
              const lessonProgress = progressMap.get(lesson.id);

              return {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                sortOrder: lesson.sortOrder,
                status: lessonProgress?.status ?? "NOT_STARTED",
                startedAt: lessonProgress?.startedAt ?? null,
                completedAt: lessonProgress?.completedAt ?? null,
              };
            }),
        }));

      return {
        courseId,
        courseTitle: course.title,
        courseSlug: course.slug,
        totalModules: moduleCountByCourse.get(courseId) ?? 0,
        totalLessons,
        completedLessons,
        startedLessons,
        remainingLessons,
        progressPercentage,
        progress: progressPercentage,
        modules: courseModules,
        assessments: courseAssessments,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const assessmentRows = assessmentsForStudent.map((assessment) => {
    const submission = latestSubmissionMap.get(assessment.id);
    const course = courseMap.get(assessment.courseId);

    return {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      courseId: assessment.courseId,
      courseTitle: course?.title ?? "Course",
      totalMarks: assessment.totalMarks,
      dueAt: assessment.dueAt,
      isActive: assessment.isActive,
      createdByUserId: assessment.createdByUserId ?? null,
      createdByName: assessment.createdByUserId
        ? userById.get(assessment.createdByUserId)?.name ?? null
        : null,
      createdByRole: assessment.createdByUserId
        ? userById.get(assessment.createdByUserId)?.role ?? null
        : null,
      latestSubmission: submission
        ? {
            id: submission.id,
            attemptNumber: submission.attemptNumber,
            score: submission.score,
            status: submission.status,
            feedback: submission.feedback,
            startedAt: submission.startedAt,
            submittedAt: submission.submittedAt,
            submissionFileName: submission.submissionFileName,
            submissionFileUrl: submission.submissionFileUrl,
          }
        : null,
    };
  });

  const certificateCourseMap = new Map(
    courses.map((course) => [course.id, course])
  );

  const packages = await db.orm.public.CoursePackage.all();
  const packageMap = new Map(
    packages.map((pkg) => [pkg.id, pkg])
  );

  const certificateRows = certificates
    .sort(
      (a, b) =>
        new Date(b.issuedAt).getTime() -
        new Date(a.issuedAt).getTime()
    )
    .map((certificate) => ({
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      certificateType: certificate.certificateType,
      courseId: certificate.courseId,
      courseTitle:
        (certificate.courseId
          ? certificateCourseMap.get(certificate.courseId)?.title
          : null) ??
        (certificate.packageId
          ? packageMap.get(certificate.packageId)?.title
          : null) ??
        (certificate.certificateType === "PACKAGE"
          ? "Package Certificate"
          : "Course Certificate"),
      packageId: certificate.packageId,
      packageTitle: certificate.packageId
        ? packageMap.get(certificate.packageId)?.title ?? null
        : null,
      issuedAt: certificate.issuedAt,
      certificateUrl: certificate.certificateUrl,
    }));

  const meetingRows = (meetings as any[])
    .filter((meeting) => studentRelatedMeetingIds.has(meeting.id))
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() -
        new Date(b.startAt).getTime()
    )
    .map((meeting) => {
      const organizer = userById.get(meeting.organizerUserId);
      const course = meeting.courseId
        ? meetingCourseMap.get(meeting.courseId)
        : null;
      const batch = meeting.batchId
        ? meetingBatchMap.get(meeting.batchId)
        : null;

      return {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description ?? null,
        startAt: meeting.startAt,
        endAt: meeting.endAt,
        meetingUrl: meeting.meetingUrl ?? null,
        meetingPlatform: meeting.meetingPlatform ?? null,
        meetingType: meeting.meetingType ?? null,
        status: meeting.status ?? null,
        course: course
          ? { id: course.id, title: course.title }
          : null,
        batch: batch
          ? { id: batch.id, name: batch.name }
          : null,
        organizer: organizer
          ? {
              id: organizer.id,
              name: organizer.name,
              email: organizer.email,
              role: organizer.role,
            }
          : null,
      };
    });

  const totalCourses = courseProgress.length;
  const completedCourses = courseProgress.filter(
    (course) => course.progressPercentage === 100
  ).length;
  const totalLessons = courseProgress.reduce(
    (sum, course) => sum + course.totalLessons,
    0
  );
  const completedLessons = courseProgress.reduce(
    (sum, course) => sum + course.completedLessons,
    0
  );
  const averageProgress =
    totalCourses === 0
      ? 0
      : Math.round(
          courseProgress.reduce(
            (sum, course) => sum + course.progressPercentage,
            0
          ) / totalCourses
        );

  const attemptedAssessments = assessmentRows.filter(
    (assessment) => assessment.latestSubmission !== null
  ).length;

  return {
    student,
    progress: {
      summary: {
        totalCourses,
        completedCourses,
        totalLessons,
        completedLessons,
        averageProgress,
        totalAssessments: assessmentRows.length,
        attemptedAssessments,
        totalCertificates: certificateRows.length,
      },
      courseProgress,
      assessments: assessmentRows,
      meetings: meetingRows,
      certificates: certificateRows,
      enrollments: activeEnrollments,
    },
    batch: {
      id: batchId,
      assignmentId: assignment.id,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
    },
  };
}
