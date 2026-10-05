import crypto from "crypto";

import { db } from "../../prisma/db";
import { sendStudentWelcomeEmail } from "../../notifications/services/student-welcome-email.service";

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
      //
      // IMPORTANT:
      // Keep the same registration information that
      // the existing DEV payment flow stores.

      const studentProfile =
        await tx.orm.public.StudentProfile.create({
          // ------------------------------------------------
          // Basic student information
          // ------------------------------------------------

          userId: user.id,

          studentId,

          dateOfBirth:
            registrationIntent.dateOfBirth ?? null,

          gender:
            registrationIntent.gender ?? null,

          qualification:
            registrationIntent.qualification ?? null,

          organization:
            registrationIntent.organization ?? null,

          // ------------------------------------------------
          // Address
          // ------------------------------------------------

          address:
            registrationIntent.address ?? null,

          city:
            registrationIntent.city ?? null,

          pin:
            registrationIntent.pin ?? null,

          state:
            registrationIntent.state ?? null,

          // ------------------------------------------------
          // Parent / Guardian details
          // ------------------------------------------------

          guardianName:
            registrationIntent.guardianName ?? null,

          guardianRelationship:
            registrationIntent.guardianRelationship ?? null,

          guardianMobile:
            registrationIntent.guardianMobile ?? null,

          guardianWhatsapp:
            registrationIntent.guardianWhatsapp ?? null,

          guardianEmail:
            registrationIntent.guardianEmail ?? null,

          // ------------------------------------------------
          // Online learning facilities
          // ------------------------------------------------

          deviceTypes:
            registrationIntent.deviceTypes ?? null,

          internetFacility:
            registrationIntent.internetFacility ?? null,

          preferredClassApp:
            registrationIntent.preferredClassApp ?? null,

          // ------------------------------------------------
          // Referral / source
          // ------------------------------------------------

          referralId:
            registrationIntent.referralId ?? null,

          referralSource:
            registrationIntent.referralSource ?? null,

          referralName:
            registrationIntent.referralName ?? null,

          referralMobile:
            registrationIntent.referralMobile ?? null,

          // ------------------------------------------------
          // Declaration
          // ------------------------------------------------

          declarationAccepted:
            registrationIntent.declarationAccepted ?? false,
        });

      // ----------------------------------------------
      // Create Enrollment
      // ----------------------------------------------

      const enrollment =
        await tx.orm.public.Enrollment.create({
          userId: user.id,

          studentId:
            studentProfile.id,

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
      //
      // This is the REAL Razorpay payment.
      // Do not create another payment record here.
      // The payment record was already created when
      // the Razorpay order was created.

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

        registrationIntent:
          updatedIntent,
      };
    }
  );

  // --------------------------------------------------
  // 7. Send student welcome email
  // --------------------------------------------------
  //
  // IMPORTANT:
  // Send the email only after the database
  // transaction has successfully committed.
  //
  // If email sending fails, the successful
  // registration/payment remains successful.

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

  // --------------------------------------------------
  // 8. Return frontend-safe response
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

      dateOfBirth:
        result.studentProfile.dateOfBirth,

      gender:
        result.studentProfile.gender,

      qualification:
        result.studentProfile.qualification,

      organization:
        result.studentProfile.organization,

      guardianName:
        result.studentProfile.guardianName,

      guardianRelationship:
        result.studentProfile.guardianRelationship,

      guardianMobile:
        result.studentProfile.guardianMobile,

      guardianWhatsapp:
        result.studentProfile.guardianWhatsapp,

      guardianEmail:
        result.studentProfile.guardianEmail,

      deviceTypes:
        result.studentProfile.deviceTypes,

      internetFacility:
        result.studentProfile.internetFacility,

      preferredClassApp:
        result.studentProfile.preferredClassApp,

      address:
        result.studentProfile.address,

      city:
        result.studentProfile.city,

      pin:
        result.studentProfile.pin,

      state:
        result.studentProfile.state,

      referralId:
        result.studentProfile.referralId,

      referralSource:
        result.studentProfile.referralSource,

      referralName:
        result.studentProfile.referralName,

      referralMobile:
        result.studentProfile.referralMobile,

      declarationAccepted:
        result.studentProfile.declarationAccepted,
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