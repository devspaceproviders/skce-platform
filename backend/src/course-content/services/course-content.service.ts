import { db } from "../../prisma/db";

export async function getCourseContentForStudent(
  userId: number,
  courseId: number
) {
  // 1. Get course
  const course = await db.orm.public.Course
    .where({ id: courseId })
    .first();

  if (!course) {
    throw new Error("Course not found");
  }

  // 2. Get all enrollments for the student
  const enrollments =
    await db.orm.public.Enrollment.all();

  const studentEnrollments =
    enrollments.filter(
      (enrollment) =>
        enrollment.userId === userId &&
        enrollment.status !== "CANCELLED"
    );

  // 3. Check direct course enrollment
  let enrollment =
    studentEnrollments.find(
      (item) => item.courseId === courseId
    ) ?? null;

  let packageData = null;

  // 4. If not directly enrolled, check package enrollment
  if (!enrollment) {
    const packageEnrollment =
      studentEnrollments.find(
        (item) => item.packageId !== null
      );

    if (packageEnrollment?.packageId) {
      const packageCourses =
        await db.orm.public.PackageCourse.all();

      const packageCourse =
        packageCourses.find(
          (item) =>
            item.courseId === courseId &&
            item.packageId ===
              packageEnrollment.packageId
        );

      if (packageCourse) {
        enrollment = packageEnrollment;

        const pkg =
          await db.orm.public.CoursePackage
            .where({
              id: packageEnrollment.packageId,
            })
            .first();

        if (pkg) {
          packageData = {
            id: pkg.id,
            slug: pkg.slug,
            title: pkg.title,
            description: pkg.description,

            /*
             * Package price is valid here because
             * package pricing is the source of truth.
             */
            price: pkg.price,
          };
        }
      }
    }
  }

  // 5. Student is not enrolled
  if (!enrollment) {
    throw new Error(
      "You are not enrolled in this course"
    );
  }

  // 6. Get LMS modules
  const allModules =
    await db.orm.public.CourseModule.all();

  const modules = allModules
    .filter(
      (module) =>
        module.courseId === courseId &&
        module.isActive
    )
    .sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

  // 7. Get LMS lessons
  const allLessons =
    await db.orm.public.Lesson.all();

  const lessons = allLessons
    .filter(
      (lesson) =>
        lesson.isActive &&
        modules.some(
          (module) =>
            module.id === lesson.moduleId
        )
    )
    .sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

  // 8. Attach lessons to modules
  const moduleData = modules.map(
    (module) => ({
      id: module.id,
      courseId: module.courseId,
      title: module.title,
      description: module.description,
      sortOrder: module.sortOrder,
      isActive: module.isActive,

      lessons: lessons
        .filter(
          (lesson) =>
            lesson.moduleId === module.id
        )
        .map((lesson) => ({
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          documentUrl: lesson.documentUrl,
          imageUrl: lesson.imageUrl,
          sortOrder: lesson.sortOrder,
          isActive: lesson.isActive,
        })),
    })
  );

  return {
    /*
     * Course information.
     *
     * IMPORTANT:
     * There is intentionally NO course.price here.
     *
     * Courses do not have individual fees.
     */
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      mode: course.mode,
      duration: course.duration,
      modules: course.modules,
      imageUrl: course.imageUrl,
      isActive: course.isActive,
    },

    enrollment: {
      id: enrollment.id,
      userId: enrollment.userId,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      packageId: enrollment.packageId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
    },

    /*
     * Package information, including the
     * package amount when applicable.
     */
    package: packageData,

    // Real LMS content
    modules: moduleData,

    // Keep these for future expansion
    lessons,
    videos: [],
    documents: [],
    assignments: [],
    quizzes: [],

    progress: null,

    hasContent: moduleData.length > 0,
  };
}