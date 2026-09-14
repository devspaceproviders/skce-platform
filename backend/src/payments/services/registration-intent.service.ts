import bcrypt from "bcryptjs";

import { db } from "../../prisma/db";
import type { RegisterInput } from "../../auth/validators/auth.validator";

export async function createRegistrationIntent(
  input: RegisterInput
) {
  // --------------------------------------------------
  // 1. Package is required
  // --------------------------------------------------

  if (!input.packageSlug) {
    throw new Error("Package is required");
  }

  // --------------------------------------------------
  // 2. Check whether an account already exists
  // --------------------------------------------------

  const existingUser =
    await db.orm.public.User.first({
      email: input.email,
    });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists"
    );
  }

  // --------------------------------------------------
  // 3. Find selected package
  // --------------------------------------------------

  const coursePackage =
    await db.orm.public.CoursePackage.first({
      slug: input.packageSlug,
    });

  if (
    !coursePackage ||
    !coursePackage.isActive
  ) {
    throw new Error("Package not found");
  }

  // --------------------------------------------------
  // 4. Find selected course, if supplied
  // --------------------------------------------------

  let course = null;

  if (input.courseSlug) {
    course =
      await db.orm.public.Course.first({
        slug: input.courseSlug,
      });

    if (!course || !course.isActive) {
      throw new Error("Course not found");
    }

    // ----------------------------------------------
    // 5. Verify course belongs to selected package
    // ----------------------------------------------

    const packageCourse =
      await db.orm.public.PackageCourse.first({
        packageId: coursePackage.id,
        courseId: course.id,
      });

    if (!packageCourse) {
      throw new Error(
        "Selected course is not included in the selected package"
      );
    }
  }

  // --------------------------------------------------
  // 6. Hash password
  // --------------------------------------------------

  const passwordHash =
    await bcrypt.hash(
      input.password,
      12
    );

  // --------------------------------------------------
  // 7. Create registration intent
  // --------------------------------------------------

  const registrationIntent =
    await db.orm.public.RegistrationIntent.create({
      name: input.name,
      email: input.email,
      phone: input.phone,

      passwordHash,

      state:
        input.state ?? null,

      referralId:
        input.referralId ?? null,

      packageId:
        coursePackage.id,

      courseId:
        course?.id ?? null,

      status: "CREATED",
    });

  // --------------------------------------------------
  // 8. Return safe response
  // --------------------------------------------------

  return {
    registrationIntent,

    package: {
      id: coursePackage.id,
      slug: coursePackage.slug,
      title: coursePackage.title,
      price: coursePackage.price,
    },

    course: course
      ? {
          id: course.id,
          slug: course.slug,
          title: course.title,
        }
      : null,
  };
}