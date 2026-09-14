import { db } from "../../prisma/db";
import { sendEmail } from "./email.service";
import {
  buildStudentWelcomeEmail,
} from "../templates/student-welcome.template";

export async function sendStudentWelcomeEmail(
  userId: number
) {
  const user =
    await db.orm.public.User.first({
      id: userId,
    });

  if (!user) {
    throw new Error(
      "User not found for welcome email"
    );
  }

  const studentProfile =
    await db.orm.public.StudentProfile.first({
      userId,
    });

  if (!studentProfile) {
    throw new Error(
      "Student profile not found for welcome email"
    );
  }

  const enrollment =
    await db.orm.public.Enrollment.first({
      userId,
    });

  if (!enrollment) {
    throw new Error(
      "Enrollment not found for welcome email"
    );
  }

  if (!enrollment.packageId) {
    throw new Error(
      "Package not found for welcome email"
    );
  }

  const coursePackage =
    await db.orm.public.CoursePackage.first({
      id: enrollment.packageId,
    });

  if (!coursePackage) {
    throw new Error(
      "Course package not found for welcome email"
    );
  }

  /*
   * ==========================================================
   * GET COURSES IN THE SELECTED PACKAGE
   * ==========================================================
   *
   * Prisma 8 contract API does not accept the
   * filter object directly in PackageCourse.all().
   *
   * Therefore we retrieve the records and filter
   * them in application code.
   */

  const allPackageCourses =
    await db.orm.public.PackageCourse.all();

  const packageCourses =
    allPackageCourses.filter(
      (item) =>
        item.packageId ===
        enrollment.packageId
    );

  const courses: string[] = [];

  for (const packageCourse of packageCourses) {
    const course =
      await db.orm.public.Course.first({
        id: packageCourse.courseId,
      });

    if (course) {
      courses.push(course.title);
    }
  }

  /*
   * ==========================================================
   * BUILD WELCOME EMAIL
   * ==========================================================
   */

  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  const email =
    buildStudentWelcomeEmail({
      studentName: user.name,

      studentId:
        studentProfile.studentId,

      email: user.email,

      packageTitle:
        coursePackage.title,

      amount:
        coursePackage.price,

      currency: "INR",

      courses,

      loginUrl:
        `${frontendUrl}/login`,
    });

  /*
   * ==========================================================
   * SEND EMAIL
   * ==========================================================
   */

  return sendEmail({
    to: user.email,

    subject:
      "Welcome to SK Computer Education – Registration Successful",

    html: email.html,

    text: email.text,
  });
}