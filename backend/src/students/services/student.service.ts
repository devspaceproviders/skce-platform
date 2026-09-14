import { db } from "../../prisma/db";

/* -------------------------------------------------------------------------- */
/* GET ALL STUDENTS                                                           */
/* -------------------------------------------------------------------------- */

export async function getAllStudents() {
  const users = await db.orm.public.User.all();
  const profiles = await db.orm.public.StudentProfile.all();
  const enrollments = await db.orm.public.Enrollment.all();
  const courses = await db.orm.public.Course.all();
  const packages = await db.orm.public.CoursePackage.all();
  const packageCourses = await db.orm.public.PackageCourse.all();

  const studentUsers = users
    .filter((user) => user.role === "STUDENT")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return studentUsers.map((user) => {
    const profile = profiles.find(
      (item) => item.userId === user.id
    );

    const userEnrollments = enrollments.filter(
      (item) => item.userId === user.id
    );

    const courseNames: string[] = [];
    const packageNames: string[] = [];

    for (const enrollment of userEnrollments) {
      if (enrollment.courseId) {
        const course = courses.find(
          (item) => item.id === enrollment.courseId
        );

        if (
          course &&
          !courseNames.includes(course.title)
        ) {
          courseNames.push(course.title);
        }
      }

      if (enrollment.packageId) {
        const pkg = packages.find(
          (item) => item.id === enrollment.packageId
        );

        if (
          pkg &&
          !packageNames.includes(pkg.title)
        ) {
          packageNames.push(pkg.title);
        }

        const packageItems = packageCourses.filter(
          (item) =>
            item.packageId === enrollment.packageId
        );

        for (const packageItem of packageItems) {
          const course = courses.find(
            (item) => item.id === packageItem.courseId
          );

          if (
            course &&
            !courseNames.includes(course.title)
          ) {
            courseNames.push(course.title);
          }
        }
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      studentId: profile?.studentId ?? "",
      state: profile?.state ?? "",
      referralId: profile?.referralId ?? "",

      courses: courseNames,
      packages: packageNames,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* GET SINGLE STUDENT                                                         */
/* -------------------------------------------------------------------------- */

export async function getStudentByStudentId(
  studentId: string
) {
  const profile =
    await db.orm.public.StudentProfile
      .where({
        studentId,
      })
      .first();

  if (!profile) {
    return null;
  }

  const user =
    await db.orm.public.User
      .where({
        id: profile.userId,
      })
      .first();

  if (!user) {
    return null;
  }

  const enrollments =
    await db.orm.public.Enrollment.all();

  const courses =
    await db.orm.public.Course.all();

  const packages =
    await db.orm.public.CoursePackage.all();

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const payments =
    await db.orm.public.Payment.all();

  const userEnrollments = enrollments
    .filter(
      (item) => item.userId === user.id
    )
    .sort(
      (a, b) =>
        new Date(b.enrolledAt).getTime() -
        new Date(a.enrolledAt).getTime()
    );

  const userPayments = payments
    .filter(
      (item) => item.userId === user.id
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  const enrollmentData = userEnrollments.map(
    (enrollment) => {
      let course = null;

      if (enrollment.courseId) {
        course =
          courses.find(
            (item) =>
              item.id === enrollment.courseId
          ) ?? null;
      }

      let packageData = null;

      if (enrollment.packageId) {
        const pkg =
          packages.find(
            (item) =>
              item.id === enrollment.packageId
          ) ?? null;

        if (pkg) {
          const packageItems =
            packageCourses.filter(
              (item) =>
                item.packageId ===
                enrollment.packageId
            );

          const packageCourseData =
            packageItems
              .map((packageItem) => {
                const packageCourse =
                  courses.find(
                    (item) =>
                      item.id ===
                      packageItem.courseId
                  );

                if (!packageCourse) {
                  return null;
                }

                return {
                  id: packageItem.id,
                  packageId:
                    packageItem.packageId,
                  courseId:
                    packageItem.courseId,
                  course: packageCourse,
                };
              })
              .filter(
                (
                  item
                ): item is NonNullable<typeof item> =>
                  item !== null
              );

          packageData = {
            id: pkg.id,
            slug: pkg.slug,
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            isActive: pkg.isActive,
            courses: packageCourseData,
          };
        }
      }

      return {
        id: enrollment.id,
        userId: enrollment.userId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        packageId: enrollment.packageId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        course,
        package: packageData,
      };
    }
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,

    studentId: profile.studentId,
    state: profile.state,
    referralId: profile.referralId,

    enrollments: enrollmentData,

    payments: userPayments.map(
      (payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        providerOrderId:
          payment.providerOrderId,
        providerPaymentId:
          payment.providerPaymentId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      })
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* GET LOGGED-IN STUDENT DASHBOARD                                            */
/* -------------------------------------------------------------------------- */

export async function getStudentDashboard(
  userId: number
) {
  /* ------------------------------------------------------------------------ */
  /* Student                                                                   */
  /* ------------------------------------------------------------------------ */

  const user =
    await db.orm.public.User
      .where({
        id: userId,
      })
      .first();

  if (!user) {
    throw new Error("Student not found");
  }

  const student =
    await db.orm.public.StudentProfile
      .where({
        userId,
      })
      .first();

  if (!student) {
    throw new Error(
      "Student profile not found"
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Load database data                                                        */
  /* ------------------------------------------------------------------------ */

  const allEnrollments =
    await db.orm.public.Enrollment.all();

  const courses =
    await db.orm.public.Course.all();

  const packages =
    await db.orm.public.CoursePackage.all();

  const packageCourses =
    await db.orm.public.PackageCourse.all();

  const allPayments =
    await db.orm.public.Payment.all();

  /* ------------------------------------------------------------------------ */
  /* Student enrollments                                                       */
  /* ------------------------------------------------------------------------ */

  const enrollments = allEnrollments
    .filter(
      (item) => item.userId === userId
    )
    .sort(
      (a, b) =>
        new Date(b.enrolledAt).getTime() -
        new Date(a.enrolledAt).getTime()
    );

  /* ------------------------------------------------------------------------ */
  /* Student payments                                                          */
  /* ------------------------------------------------------------------------ */

  const payments = allPayments
    .filter(
      (item) => item.userId === userId
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  /* ------------------------------------------------------------------------ */
  /* Build enrollment data                                                     */
  /* ------------------------------------------------------------------------ */

  const enrollmentData =
    enrollments.map((enrollment) => {
      /* -------------------------------------------------------------------- */
      /* Direct course                                                         */
      /* -------------------------------------------------------------------- */

      let course = null;

      if (enrollment.courseId) {
        course =
          courses.find(
            (item) =>
              item.id === enrollment.courseId
          ) ?? null;
      }

      /* -------------------------------------------------------------------- */
      /* Package                                                               */
      /* -------------------------------------------------------------------- */

      let packageData = null;

      if (enrollment.packageId) {
        const pkg =
          packages.find(
            (item) =>
              item.id === enrollment.packageId
          ) ?? null;

        if (pkg) {
          const packageItems =
            packageCourses.filter(
              (item) =>
                item.packageId ===
                enrollment.packageId
            );

          const packageCourseData =
            packageItems
              .map((packageItem) => {
                const packageCourse =
                  courses.find(
                    (courseItem) =>
                      courseItem.id ===
                      packageItem.courseId
                  );

                if (!packageCourse) {
                  return null;
                }

                return {
                  id: packageItem.id,
                  packageId:
                    packageItem.packageId,
                  courseId:
                    packageItem.courseId,
                  course: packageCourse,
                };
              })
              .filter(
                (
                  item
                ): item is NonNullable<typeof item> =>
                  item !== null
              );

          packageData = {
            id: pkg.id,
            slug: pkg.slug,
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            isActive: pkg.isActive,
            courses: packageCourseData,
          };
        }
      }

      return {
        id: enrollment.id,
        userId: enrollment.userId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        packageId: enrollment.packageId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        course,
        package: packageData,
      };
    });

  /* ------------------------------------------------------------------------ */
  /* Unique course count                                                      */
  /* ------------------------------------------------------------------------ */

  const uniqueCourseIds =
    new Set<number>();

  for (const enrollment of enrollmentData) {
    if (enrollment.course) {
      uniqueCourseIds.add(
        enrollment.course.id
      );
    }

    if (enrollment.package) {
      for (const item of
        enrollment.package.courses) {
        if (item.course) {
          uniqueCourseIds.add(
            item.course.id
          );
        }
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Statistics                                                               */
  /* ------------------------------------------------------------------------ */

  const activeEnrollments =
    enrollments.filter(
      (item) =>
        item.status === "ACTIVE"
    );

  const successfulPayments =
    payments.filter(
      (item) =>
        item.status === "SUCCESS"
    );

  const totalPaid =
    successfulPayments.reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  /* ------------------------------------------------------------------------ */
  /* Return                                                                   */
  /* ------------------------------------------------------------------------ */

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      state: student.state,
      referralId: student.referralId,
      isActive: user.isActive,
    },

    stats: {
      enrolledCourses:
        uniqueCourseIds.size,

      activeEnrollments:
        activeEnrollments.length,

      successfulPayments:
        successfulPayments.length,

      totalPaid,
    },

    enrollments: enrollmentData,

    payments: payments.map(
      (payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        providerOrderId:
          payment.providerOrderId,
        providerPaymentId:
          payment.providerPaymentId,
        providerSignature:
          payment.providerSignature,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      })
    ),

    /*
     * These remain empty until the corresponding
     * database models are implemented.
     *
     * We intentionally do NOT generate fake data.
     */
    assignments: [],
    quizzes: [],
    liveClasses: [],
    recentActivity: [],
    certificates: [],
  };
}