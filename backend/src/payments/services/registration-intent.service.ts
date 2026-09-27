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
  // 4. Find selected course
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

    // ------------------------------------------------
    // 5. Verify course belongs to selected package
    // ------------------------------------------------

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
      // ==================================================
      // ACCOUNT DETAILS
      // ==================================================

      name:
        input.name,

      email:
        input.email,

      phone:
        input.phone,

      passwordHash,

      // ==================================================
      // STUDENT DETAILS
      // ==================================================

      dateOfBirth:
        input.dateOfBirth,

      gender:
        input.gender,

      qualification:
        input.qualification,

      organization:
        input.organization,

      // ==================================================
      // PARENT / GUARDIAN DETAILS
      // ==================================================

      guardianName:
        input.guardianName,

      guardianRelationship:
        input.guardianRelationship,

      guardianMobile:
        input.guardianMobile,

      guardianWhatsapp:
        input.guardianWhatsapp || null,

      guardianEmail:
        input.guardianEmail || null,

      // ==================================================
      // ONLINE LEARNING FACILITIES
      // ==================================================

      deviceTypes:
        input.deviceTypes,

      internetFacility:
        input.internetFacility,

      preferredClassApp:
        input.preferredClassApp,

      // ==================================================
      // ADDRESS
      // ==================================================

      address:
        input.address,

      city:
        input.city,

      pin:
        input.pin,

      state:
        input.state,

      // ==================================================
      // REFERRAL / SOURCE
      // ==================================================

      // Existing technical referral ID
      // retained for backward compatibility.
      referralId:
        input.referralId || null,

      referralSource:
        input.referralSource,

      referralName:
        input.referralName || null,

      referralMobile:
        input.referralMobile || null,

      // ==================================================
      // PACKAGE / COURSE
      // ==================================================

      packageId:
        coursePackage.id,

      courseId:
        course?.id ?? null,

      // ==================================================
      // DECLARATION
      // ==================================================

      declarationAccepted:
        input.declarationAccepted,

      // ==================================================
      // STATUS
      // ==================================================

      status:
        "CREATED",
    });

  // --------------------------------------------------
  // 8. Return safe response
  // --------------------------------------------------

  return {
    registrationIntent,

    package: {
      id:
        coursePackage.id,

      slug:
        coursePackage.slug,

      title:
        coursePackage.title,

      price:
        coursePackage.price,
    },

    course: course
      ? {
          id:
            course.id,

          slug:
            course.slug,

          title:
            course.title,
        }
      : null,
  };
}