import { db } from "../../prisma/db";

/**
 * Check whether a student is enrolled in a specific course.
 */
async function verifyCourseEnrollment(
  userId: number,
  courseId: number
) {
  const enrollments =
    await db.orm.public.Enrollment.all();

  // Direct course enrollment
  const directEnrollment =
    enrollments.find(
      (enrollment) =>
        enrollment.userId === userId &&
        enrollment.courseId === courseId &&
        enrollment.status !== "CANCELLED"
    );

  if (directEnrollment) {
    return directEnrollment;
  }

  // Package enrollment
  const packageEnrollment =
    enrollments.find(
      (enrollment) =>
        enrollment.userId === userId &&
        enrollment.packageId !== null &&
        enrollment.status !== "CANCELLED"
    );

  if (!packageEnrollment?.packageId) {
    return null;
  }

  // Verify that this course belongs to
  // the student's purchased package.
  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const packageCourse =
    packageCourses.find(
      (item) =>
        item.packageId ===
          packageEnrollment.packageId &&
        item.courseId === courseId
    );

  if (!packageCourse) {
    return null;
  }

  return packageEnrollment;
}


/**
 * Get all active lessons for a course in the same order used by the LMS.
 */
async function getOrderedCourseLessons(
  courseId: number
) {
  const allModules =
    await db.orm.public.CourseModule.all();

  const courseModules =
    allModules
      .filter(
        (module) =>
          module.courseId === courseId &&
          module.isActive
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.id - b.id
      );

  const moduleIds =
    courseModules.map(
      (module) => module.id
    );

  const allLessons =
    await db.orm.public.Lesson.all();

  return allLessons
    .filter(
      (lesson) =>
        moduleIds.includes(lesson.moduleId) &&
        lesson.isActive
    )
    .sort((a, b) => {
      const moduleA =
        courseModules.find(
          (module) =>
            module.id === a.moduleId
        );

      const moduleB =
        courseModules.find(
          (module) =>
            module.id === b.moduleId
        );

      return (
        (moduleA?.sortOrder ?? 0) -
          (moduleB?.sortOrder ?? 0) ||
        (moduleA?.id ?? 0) -
          (moduleB?.id ?? 0) ||
        a.sortOrder - b.sortOrder ||
        a.id - b.id
      );
    });
}


/**
 * Start a lesson for a student.
 */
export async function startLesson(
  userId: number,
  lessonId: number
) {
  // ----------------------------------------------------------
  // Find lesson
  // ----------------------------------------------------------

  const lesson =
    await db.orm.public.Lesson
      .where({
        id: lessonId,
      })
      .first();

  if (!lesson) {
    throw new Error("Lesson not found");
  }


  // ----------------------------------------------------------
  // Find module
  // ----------------------------------------------------------

  const module =
    await db.orm.public.CourseModule
      .where({
        id: lesson.moduleId,
      })
      .first();

  if (!module) {
    throw new Error(
      "Course module not found"
    );
  }


  // ----------------------------------------------------------
  // Find course
  // ----------------------------------------------------------

  const course =
    await db.orm.public.Course
      .where({
        id: module.courseId,
      })
      .first();

  if (!course) {
    throw new Error("Course not found");
  }


  // ----------------------------------------------------------
  // Verify enrollment
  // ----------------------------------------------------------

  const enrollment =
    await verifyCourseEnrollment(
      userId,
      course.id
    );

  if (!enrollment) {
    throw new Error(
      "You are not enrolled in this course"
    );
  }


  // ----------------------------------------------------------
  // Sequential lesson locking
  // ----------------------------------------------------------
  //
  // Lesson 1 is available immediately.
  // Every later lesson requires the immediately previous
  // active lesson in course order to be COMPLETED.
  // ----------------------------------------------------------

  const orderedLessons =
    await getOrderedCourseLessons(course.id);

  const currentIndex =
    orderedLessons.findIndex(
      (item) => item.id === lessonId
    );

  if (currentIndex === -1) {
    throw new Error(
      "Lesson is not active in this course"
    );
  }

  if (currentIndex > 0) {
    const previousLesson =
      orderedLessons[currentIndex - 1];

    if (!previousLesson) {
      throw new Error(
        "Previous lesson not found"
      );
    }

    const previousProgress =
      await db.orm.public.LessonProgress
        .where({
          userId,
          lessonId: previousLesson.id,
        })
        .first();

    if (
      previousProgress?.status !==
      "COMPLETED"
    ) {
      throw new Error(
        "This lesson is locked. Complete the previous lesson first."
      );
    }
  }


  // ----------------------------------------------------------
  // Check existing progress
  // ----------------------------------------------------------

  const existing =
    await db.orm.public.LessonProgress
      .where({
        userId,
        lessonId,
      })
      .first();

  if (existing) {
    // If already completed, do not move it
    // backwards to IN_PROGRESS.
    if (
      existing.status ===
      "COMPLETED"
    ) {
      return existing;
    }

    return existing;
  }


  // ----------------------------------------------------------
  // Create progress
  // ----------------------------------------------------------

  const progress =
    await db.orm.public.LessonProgress.create({
      userId,
      lessonId,
      status: "IN_PROGRESS",
      startedAt:
        new Date().toISOString(),
    });

  return progress;
}


/**
 * Mark a lesson as completed.
 */
export async function completeLesson(
  userId: number,
  lessonId: number
) {
  // ----------------------------------------------------------
  // Find lesson
  // ----------------------------------------------------------

  const lesson =
    await db.orm.public.Lesson
      .where({
        id: lessonId,
      })
      .first();

  if (!lesson) {
    throw new Error("Lesson not found");
  }


  // ----------------------------------------------------------
  // Find module
  // ----------------------------------------------------------

  const module =
    await db.orm.public.CourseModule
      .where({
        id: lesson.moduleId,
      })
      .first();

  if (!module) {
    throw new Error(
      "Course module not found"
    );
  }


  // ----------------------------------------------------------
  // Find course
  // ----------------------------------------------------------

  const course =
    await db.orm.public.Course
      .where({
        id: module.courseId,
      })
      .first();

  if (!course) {
    throw new Error("Course not found");
  }


  // ----------------------------------------------------------
  // Verify enrollment
  // ----------------------------------------------------------

  const enrollment =
    await verifyCourseEnrollment(
      userId,
      course.id
    );

  if (!enrollment) {
    throw new Error(
      "You are not enrolled in this course"
    );
  }


  // ----------------------------------------------------------
  // Sequential lesson locking
  // ----------------------------------------------------------
  //
  // Lesson 1 is available immediately.
  // Every later lesson requires the immediately previous
  // active lesson in course order to be COMPLETED.
  // ----------------------------------------------------------

  const orderedLessons =
    await getOrderedCourseLessons(course.id);

  const currentIndex =
    orderedLessons.findIndex(
      (item) => item.id === lessonId
    );

  if (currentIndex === -1) {
    throw new Error(
      "Lesson is not active in this course"
    );
  }

  if (currentIndex > 0) {
    const previousLesson =
      orderedLessons[currentIndex - 1];

    if (!previousLesson) {
      throw new Error(
        "Previous lesson not found"
      );
    }

    const previousProgress =
      await db.orm.public.LessonProgress
        .where({
          userId,
          lessonId: previousLesson.id,
        })
        .first();

    if (
      previousProgress?.status !==
      "COMPLETED"
    ) {
      throw new Error(
        "This lesson is locked. Complete the previous lesson first."
      );
    }
  }


  // ----------------------------------------------------------
  // Check existing progress
  // ----------------------------------------------------------

  const existing =
    await db.orm.public.LessonProgress
      .where({
        userId,
        lessonId,
      })
      .first();


  // ----------------------------------------------------------
  // Already completed
  // ----------------------------------------------------------

  if (
    existing &&
    existing.status === "COMPLETED"
  ) {
    return existing;
  }


  // ----------------------------------------------------------
  // Update existing progress
  //
  // Prisma 8:
  // .where(...)
  // .update(...)
  // ----------------------------------------------------------

  if (existing) {
    const updated =
      await db.orm.public.LessonProgress
        .where({
          id: existing.id,
        })
        .update({
          status: "COMPLETED",
          startedAt:
            existing.startedAt ??
            new Date().toISOString(),
          completedAt:
            new Date().toISOString(),
        });

    return updated;
  }


  // ----------------------------------------------------------
  // No existing progress
  //
  // Allow direct completion.
  // ----------------------------------------------------------

  const progress =
    await db.orm.public.LessonProgress.create({
      userId,
      lessonId,
      status: "COMPLETED",
      startedAt:
        new Date().toISOString(),
      completedAt:
        new Date().toISOString(),
    });

  return progress;
}


/**
 * Get progress for one course.
 */
export async function getCourseProgress(
  userId: number,
  courseId: number
) {
  // ----------------------------------------------------------
  // Find course
  // ----------------------------------------------------------

  const course =
    await db.orm.public.Course
      .where({
        id: courseId,
      })
      .first();

  if (!course) {
    throw new Error("Course not found");
  }


  // ----------------------------------------------------------
  // Verify enrollment
  // ----------------------------------------------------------

  const enrollment =
    await verifyCourseEnrollment(
      userId,
      courseId
    );

  if (!enrollment) {
    throw new Error(
      "You are not enrolled in this course"
    );
  }


  // ----------------------------------------------------------
  // Get modules
  // ----------------------------------------------------------

  const allModules =
    await db.orm.public.CourseModule.all();

  const courseModules =
    allModules.filter(
      (module) =>
        module.courseId === courseId &&
        module.isActive
    );


  // ----------------------------------------------------------
  // Get lessons
  // ----------------------------------------------------------

  const moduleIds =
    courseModules.map(
      (module) => module.id
    );

  const allLessons =
    await db.orm.public.Lesson.all();

  const lessons =
    allLessons.filter(
      (lesson) =>
        moduleIds.includes(
          lesson.moduleId
        ) &&
        lesson.isActive
    );


  // ----------------------------------------------------------
  // Get student's progress
  // ----------------------------------------------------------

  const allProgress =
    await db.orm.public.LessonProgress.all();

  const progress =
    allProgress.filter(
      (item) =>
        item.userId === userId &&
        lessons.some(
          (lesson) =>
            lesson.id ===
            item.lessonId
        )
    );


  // ----------------------------------------------------------
  // Calculate totals
  // ----------------------------------------------------------

  const totalLessons =
    lessons.length;

  const completedLessons =
    progress.filter(
      (item) =>
        item.status ===
        "COMPLETED"
    ).length;

  const startedLessons =
    progress.filter(
      (item) =>
        item.status ===
          "IN_PROGRESS" ||
        item.status ===
          "COMPLETED"
    ).length;

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


  // ----------------------------------------------------------
  // Lesson-level progress
  // ----------------------------------------------------------

  const lessonProgress =
    lessons.map(
      (lesson) => {
        const item =
          progress.find(
            (progressItem) =>
              progressItem.lessonId ===
              lesson.id
          );

        return {
          lessonId: lesson.id,

          status:
            item?.status ??
            "NOT_STARTED",

          startedAt:
            item?.startedAt ??
            null,

          completedAt:
            item?.completedAt ??
            null,
        };
      }
    );


  return {
    courseId,

    totalLessons,

    completedLessons,

    startedLessons,

    remainingLessons,

    progressPercentage,

    lessons: lessonProgress,
  };
}