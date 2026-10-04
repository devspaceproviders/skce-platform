import { db } from "../../prisma/db";

/**
 * Admin-only student progress view.
 *
 * This is intentionally separate from the student progress service.
 * It reads the student's existing LessonProgress records without
 * changing any student LMS behaviour.
 */

export async function getAdminStudentProgress(
  studentId: string
) {
  // ------------------------------------------------------------
  // Find student profile
  // ------------------------------------------------------------

  const profile =
    await db.orm.public.StudentProfile
      .where({
        studentId,
      })
      .first();

  if (!profile) {
    throw new Error("Student not found");
  }

  // ------------------------------------------------------------
  // Find user
  // ------------------------------------------------------------

  const user =
    await db.orm.public.User
      .where({
        id: profile.userId,
      })
      .first();

  if (!user || user.role !== "STUDENT") {
    throw new Error("Student not found");
  }

  // ------------------------------------------------------------
  // Load database data
  // ------------------------------------------------------------

  const enrollments =
    await db.orm.public.Enrollment.all();

  const courses =
    await db.orm.public.Course.all();

  const packages =
    await db.orm.public.CoursePackage.all();

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const modules =
    await db.orm.public.CourseModule.all();

  const lessons =
    await db.orm.public.Lesson.all();

  const progressRecords =
    await db.orm.public.LessonProgress.all();

  const certificates =
    await db.orm.public.Certificate.all();

  const assessments =
    await db.orm.public.Assessment.all();

  const submissions =
    await db.orm.public.AssessmentSubmission.all();

  // ------------------------------------------------------------
  // Student enrollments
  // ------------------------------------------------------------

  const studentEnrollments =
    enrollments
      .filter(
        (enrollment) =>
          enrollment.userId === user.id &&
          enrollment.status !== "CANCELLED"
      )
      .sort(
        (a, b) =>
          new Date(b.enrolledAt).getTime() -
          new Date(a.enrolledAt).getTime()
      );

  // ------------------------------------------------------------
  // Resolve courses from direct + package enrollments
  // ------------------------------------------------------------

  const enrolledCourseIds = new Set<number>();

  for (const enrollment of studentEnrollments) {
    if (enrollment.courseId) {
      enrolledCourseIds.add(
        enrollment.courseId
      );
    }

    if (enrollment.packageId) {
      for (const item of packageCourses) {
        if (
          item.packageId ===
          enrollment.packageId
        ) {
          enrolledCourseIds.add(
            item.courseId
          );
        }
      }
    }
  }

  // ------------------------------------------------------------
  // Build course progress
  // ------------------------------------------------------------

  const courseProgress = courses
    .filter((course) =>
      enrolledCourseIds.has(course.id)
    )
    .map((course) => {
      const courseModules =
        modules
          .filter(
            (module) =>
              module.courseId === course.id &&
              module.isActive
          )
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.id - b.id
          );

      const moduleIds =
        new Set(
          courseModules.map(
            (module) => module.id
          )
        );

      const courseLessons =
        lessons
          .filter(
            (lesson) =>
              moduleIds.has(
                lesson.moduleId
              ) &&
              lesson.isActive
          )
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.id - b.id
          );

      const lessonIds =
        new Set(
          courseLessons.map(
            (lesson) => lesson.id
          )
        );

      const courseProgressRecords =
        progressRecords.filter(
          (progress) =>
            progress.userId === user.id &&
            lessonIds.has(
              progress.lessonId
            )
        );

      const completedLessons =
        courseProgressRecords.filter(
          (progress) =>
            progress.status ===
            "COMPLETED"
        ).length;

      const startedLessons =
        courseProgressRecords.filter(
          (progress) =>
            progress.status ===
              "IN_PROGRESS" ||
            progress.status ===
              "COMPLETED"
        ).length;

      const totalLessons =
        courseLessons.length;

      const remainingLessons =
        Math.max(
          totalLessons -
            completedLessons,
          0
        );

      const progressPercentage =
        totalLessons === 0
          ? 0
          : Math.round(
              (completedLessons /
                totalLessons) *
                100
            );

      const lessonProgress =
        courseLessons.map(
          (lesson) => {
            const progress =
              courseProgressRecords.find(
                (item) =>
                  item.lessonId ===
                  lesson.id
              );

            const module =
              courseModules.find(
                (item) =>
                  item.id ===
                  lesson.moduleId
              );

            return {
              lessonId: lesson.id,
              lessonTitle:
                lesson.title,
              moduleId:
                lesson.moduleId,
              moduleTitle:
                module?.title ??
                "Module",
              status:
                progress?.status ??
                "NOT_STARTED",
              startedAt:
                progress?.startedAt ??
                null,
              completedAt:
                progress?.completedAt ??
                null,
            };
          }
        );

      const courseAssessments =
        assessments.filter(
          (assessment) =>
            assessment.courseId ===
            course.id
        );

      const assessmentIds =
        new Set(
          courseAssessments.map(
            (assessment) =>
              assessment.id
          )
        );

      const courseSubmissions =
        submissions
          .filter(
            (submission) =>
              submission.userId ===
                user.id &&
              assessmentIds.has(
                submission.assessmentId
              )
          )
          .sort(
            (a, b) =>
              new Date(
                b.createdAt
              ).getTime() -
              new Date(
                a.createdAt
              ).getTime()
          );

      return {
        courseId: course.id,
        courseTitle: course.title,

        totalLessons,

        completedLessons,

        startedLessons,

        remainingLessons,

        progressPercentage,

        lessons:
          lessonProgress,

        assessments:
          courseAssessments.map(
            (assessment) => {
              const assessmentSubmissions =
                courseSubmissions.filter(
                  (submission) =>
                    submission.assessmentId ===
                    assessment.id
                );

              const latestSubmission =
                assessmentSubmissions[0];

              return {
                assessmentId:
                  assessment.id,

                title:
                  assessment.title,

                type:
                  assessment.type,

                totalMarks:
                  assessment.totalMarks,

                dueAt:
                  assessment.dueAt,

                submissionStatus:
                  latestSubmission?.status ??
                  "NOT_ATTEMPTED",

                score:
                  latestSubmission?.score ??
                  null,

                submittedAt:
                  latestSubmission?.submittedAt ??
                  null,

                feedback:
                  latestSubmission?.feedback ??
                  null,
              };
            }
          ),
      };
    });

  // ------------------------------------------------------------
  // Certificates
  // ------------------------------------------------------------

  const studentCertificates =
    certificates
      .filter(
        (certificate) =>
          certificate.userId ===
          user.id
      )
      .sort(
        (a, b) =>
          new Date(
            b.issuedAt
          ).getTime() -
          new Date(
            a.issuedAt
          ).getTime()
      )
      .map((certificate) => {
        const course =
          certificate.courseId
            ? courses.find(
                (item) =>
                  item.id ===
                  certificate.courseId
              )
            : null;

        const pkg =
          certificate.packageId
            ? packages.find(
                (item) =>
                  item.id ===
                  certificate.packageId
              )
            : null;

        return {
          id:
            certificate.id,

          certificateNumber:
            certificate.certificateNumber,

          certificateType:
            certificate.certificateType,

          title:
            course?.title ??
            pkg?.title ??
            "Certificate",

          courseId:
            certificate.courseId,

          packageId:
            certificate.packageId,

          issuedAt:
            certificate.issuedAt,

          certificateUrl:
            certificate.certificateUrl,
        };
      });

  // ------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------

  const totalCourses =
    courseProgress.length;

  const completedCourses =
    courseProgress.filter(
      (course) =>
        course.progressPercentage ===
        100
    ).length;

  const totalLessons =
    courseProgress.reduce(
      (total, course) =>
        total +
        course.totalLessons,
      0
    );

  const completedLessons =
    courseProgress.reduce(
      (total, course) =>
        total +
        course.completedLessons,
      0
    );

  const averageProgress =
    totalCourses === 0
      ? 0
      : Math.round(
          courseProgress.reduce(
            (total, course) =>
              total +
              course.progressPercentage,
            0
          ) / totalCourses
        );

  const totalAssessments =
    courseProgress.reduce(
      (total, course) =>
        total +
        course.assessments.length,
      0
    );

  const attemptedAssessments =
    courseProgress.reduce(
      (total, course) =>
        total +
        course.assessments.filter(
          (assessment) =>
            assessment.submissionStatus !==
            "NOT_ATTEMPTED"
        ).length,
      0
    );

  return {
    student: {
      id: user.id,
      studentId:
        profile.studentId ?? "",
      name: user.name,
      email: user.email,
    },

    summary: {
      totalCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      averageProgress,
      totalAssessments,
      attemptedAssessments,
      totalCertificates:
        studentCertificates.length,
    },

    courseProgress,

    certificates:
      studentCertificates,

    enrollments:
      studentEnrollments.map(
        (enrollment) => {
          const course =
            enrollment.courseId
              ? courses.find(
                  (item) =>
                    item.id ===
                    enrollment.courseId
                )
              : null;

          const pkg =
            enrollment.packageId
              ? packages.find(
                  (item) =>
                    item.id ===
                    enrollment.packageId
                )
              : null;

          return {
            id:
              enrollment.id,

            status:
              enrollment.status,

            enrolledAt:
              enrollment.enrolledAt,

            completedAt:
              enrollment.completedAt,

            course:
              course
                ? {
                    id:
                      course.id,
                    title:
                      course.title,
                  }
                : null,

            package:
              pkg
                ? {
                    id:
                      pkg.id,
                    title:
                      pkg.title,
                  }
                : null,
          };
        }
      ),
  };
}