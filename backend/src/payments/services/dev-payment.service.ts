import { db } from "../../prisma/db";
import { sendStudentWelcomeEmail } from "../../notifications/services/student-welcome-email.service";

export async function completeDevPayment(
  registrationIntentId: number
) {
  const registrationIntent =
    await db.orm.public.RegistrationIntent.first({
      id: registrationIntentId,
    });

  if (!registrationIntent) {
    throw new Error("Registration intent not found");
  }

  if (registrationIntent.status === "PAID") {
    throw new Error(
      "This registration has already been completed"
    );
  }

  const coursePackage =
    await db.orm.public.CoursePackage.first({
      id: registrationIntent.packageId,
    });

  if (!coursePackage) {
    throw new Error("Package not found");
  }

  const existingUser =
    await db.orm.public.User.first({
      email: registrationIntent.email,
    });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists"
    );
  }

  /*
   * ==========================================================
   * DATABASE TRANSACTION
   * ==========================================================
   *
   * Everything below must succeed before we send the email.
   * If anything fails, the transaction is rolled back.
   */

  const result = await db.transaction(
    async (tx) => {
      /*
       * ==========================================================
       * 1. CREATE USER
       * ==========================================================
       */

      const user =
        await tx.orm.public.User.create({
          name: registrationIntent.name,
          email: registrationIntent.email,
          phone: registrationIntent.phone,
          passwordHash:
            registrationIntent.passwordHash,
          role: "STUDENT",
          isActive: true,
        });

      /*
       * ==========================================================
       * 2. GENERATE STUDENT ID
       * ==========================================================
       */

      const studentId =
        `SKCE-${String(user.id).padStart(6, "0")}`;

      /*
       * ==========================================================
       * 3. CREATE STUDENT PROFILE
       * ==========================================================
       */

      const studentProfile =
        await tx.orm.public.StudentProfile.create({
          userId: user.id,
          studentId,
          state:
            registrationIntent.state ?? null,
          referralId:
            registrationIntent.referralId ?? null,
        });

      /*
       * ==========================================================
       * 4. CREATE ENROLLMENT
       * ==========================================================
       */

      const enrollment =
        await tx.orm.public.Enrollment.create({
          userId: user.id,
          studentId: studentProfile.id,
          courseId:
            registrationIntent.courseId ?? null,
          packageId:
            registrationIntent.packageId,
          status: "ACTIVE",
          enrolledAt:
            new Date().toISOString(),
        });

      /*
       * ==========================================================
       * 5. CREATE DEV PAYMENT
       * ==========================================================
       *
       * This is NOT a real payment.
       *
       * It exists only for development/testing until
       * Razorpay is connected.
       */

      const payment =
        await tx.orm.public.Payment.create({
          userId: user.id,
          enrollmentId: enrollment.id,
          registrationIntentId:
            registrationIntent.id,
          amount: coursePackage.price,
          currency: "INR",
          method: "OTHER",
          status: "SUCCESS",
          providerOrderId:
            `DEV-ORDER-${registrationIntent.id}`,
          providerPaymentId:
            `DEV-PAYMENT-${Date.now()}`,
          providerSignature:
            "DEV-SIMULATED",
          paidAt:
            new Date().toISOString(),
        });

      /*
       * ==========================================================
       * 6. MARK REGISTRATION INTENT AS PAID
       * ==========================================================
       */

      const updatedIntent =
        await tx.orm.public.RegistrationIntent
          .where({
            id: registrationIntent.id,
          })
          .update({
            status: "PAID",
          });

      if (!updatedIntent) {
        throw new Error(
          "Unable to update registration intent"
        );
      }

      /*
       * Return everything required after the
       * transaction has successfully committed.
       */

      return {
        user,
        studentProfile,
        enrollment,
        payment,
        registrationIntent:
          updatedIntent,
      };
    }
  );

  /*
   * ==========================================================
   * SEND STUDENT WELCOME EMAIL
   * ==========================================================
   *
   * IMPORTANT:
   * This happens AFTER the database transaction.
   *
   * Therefore:
   *
   * Database success
   *       ↓
   * Student created
   *       ↓
   * Payment recorded
   *       ↓
   * Enrollment created
   *       ↓
   * Transaction committed
   *       ↓
   * Welcome email
   *
   * If email fails, the successful registration remains
   * successful. Email failure must NOT roll back the
   * student's registration.
   */

  try {
    console.log(
      "Sending student welcome email..."
    );

    console.log(
      "Student email:",
      result.user.email
    );

    await sendStudentWelcomeEmail(
      result.user.id
    );

    console.log(
      "Student welcome email sent successfully."
    );
  } catch (emailError) {
    console.error(
      "Student welcome email failed:",
      emailError
    );
  }

  /*
   * ==========================================================
   * RETURN REGISTRATION RESULT
   * ==========================================================
   */

  return {
    success: true,

    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
    },

    student: {
      id: result.studentProfile.id,
      studentId:
        result.studentProfile.studentId,
      state:
        result.studentProfile.state,
      referralId:
        result.studentProfile.referralId,
    },

    enrollment: {
      id: result.enrollment.id,
      status:
        result.enrollment.status,
      courseId:
        result.enrollment.courseId,
      packageId:
        result.enrollment.packageId,
    },

    payment: {
      id: result.payment.id,
      amount:
        result.payment.amount,
      currency:
        result.payment.currency,
      status:
        result.payment.status,
      providerOrderId:
        result.payment.providerOrderId,
      providerPaymentId:
        result.payment.providerPaymentId,
      paidAt:
        result.payment.paidAt,
    },

    registrationIntent: {
      id:
        result.registrationIntent.id,
      status:
        result.registrationIntent.status,
    },
  };
}