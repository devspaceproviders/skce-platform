import crypto from "crypto";

import { db } from "../../prisma/db";

export async function verifyAndCompletePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error(
      "Razorpay credentials are not configured"
    );
  }

  // --------------------------------------------------
  // 1. Find our internal payment record
  // --------------------------------------------------

  const payment =
    await db.orm.public.Payment.first({
      providerOrderId: razorpayOrderId,
    });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // --------------------------------------------------
  // 2. Verify Razorpay signature
  // --------------------------------------------------

  const body =
    `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  const expectedBuffer =
    Buffer.from(expectedSignature, "utf8");

  const receivedBuffer =
    Buffer.from(razorpaySignature, "utf8");

  const signaturesMatch =
    expectedBuffer.length ===
      receivedBuffer.length &&
    crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );

  if (!signaturesMatch) {
    throw new Error(
      "Invalid Razorpay payment signature"
    );
  }

  // --------------------------------------------------
  // 3. Idempotency check
  // --------------------------------------------------
  // If the same payment is verified again,
  // don't create another student or enrollment.

  if (payment.status === "SUCCESS") {
    return {
      payment,
      alreadyCompleted: true,
    };
  }

  // --------------------------------------------------
  // 4. Registration intent is required
  // --------------------------------------------------

  if (!payment.registrationIntentId) {
    throw new Error(
      "Payment is not linked to a registration intent"
    );
  }

  const registrationIntent =
    await db.orm.public.RegistrationIntent.first({
      id: payment.registrationIntentId,
    });

  if (!registrationIntent) {
    throw new Error(
      "Registration intent not found"
    );
  }

  // --------------------------------------------------
  // 5. Check whether registration is already complete
  // --------------------------------------------------

  if (registrationIntent.status === "PAID") {
    return {
      payment,
      alreadyCompleted: true,
    };
  }

  // --------------------------------------------------
  // 6. Complete registration in one transaction
  // --------------------------------------------------

  const result = await db.transaction(
    async (tx) => {
      // ----------------------------------------------
      // Check whether the email already exists
      // ----------------------------------------------

      const existingUser =
        await tx.orm.public.User.first({
          email: registrationIntent.email,
        });

      if (existingUser) {
        throw new Error(
          "An account with this email already exists"
        );
      }

      // ----------------------------------------------
      // Create User
      // ----------------------------------------------

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

      // ----------------------------------------------
      // Generate Student ID
      // ----------------------------------------------

      const studentId =
        `SKCE-${String(user.id).padStart(6, "0")}`;

      // ----------------------------------------------
      // Create Student Profile
      // ----------------------------------------------

      const studentProfile =
        await tx.orm.public.StudentProfile.create({
          userId: user.id,
          studentId,
          state:
            registrationIntent.state ?? null,
          referralId:
            registrationIntent.referralId ?? null,
        });

      // ----------------------------------------------
      // Create Enrollment
      // ----------------------------------------------

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

      // ----------------------------------------------
      // Update Payment
      // ----------------------------------------------

      const updatedPayment =
        await tx.orm.public.Payment
          .where({
            id: payment.id,
          })
          .update({
            userId: user.id,

            enrollmentId:
              enrollment.id,

            providerPaymentId:
              razorpayPaymentId,

            providerSignature:
              razorpaySignature,

            status: "SUCCESS",

            paidAt:
              new Date().toISOString(),
          });

      if (!updatedPayment) {
        throw new Error(
          "Unable to update payment"
        );
      }

      // ----------------------------------------------
      // Mark Registration Intent as PAID
      // ----------------------------------------------

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

      // ----------------------------------------------
      // Return transaction result
      // ----------------------------------------------

      return {
        user,
        studentProfile,
        enrollment,
        payment: updatedPayment,
        registrationIntent: updatedIntent,
      };
    }
  );

  // --------------------------------------------------
  // 7. Return frontend-safe response
  // --------------------------------------------------

  return {
    alreadyCompleted: false,

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