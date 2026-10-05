import bcrypt from "bcryptjs";
import crypto from "crypto";

import { db } from "../../prisma/db";

import { sendEmail } from "../../notifications/services/email.service";

import {
  buildPasswordResetEmail,
} from "../../notifications/templates/password-reset.template";

import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator";

import {
  generateAccessToken,
} from "./token.service";

/* ==========================================================
   PASSWORD RESET CONFIGURATION
========================================================== */

const RESET_TOKEN_TTL_SECONDS =
  30 * 60;

function getResetTokenSecret(): string {
  const secret =
    process.env.PASSWORD_RESET_SECRET ||
    process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  /*
   * Local development fallback.
   * Set PASSWORD_RESET_SECRET in production.
   */
  return (
    "skce-development-password-reset-secret"
  );
}

/* ==========================================================
   PASSWORD RESET TOKEN
========================================================== */

function createPasswordResetToken(
  userId: number,
  passwordHash: string
): string {
  const expiresAt =
    Math.floor(
      Date.now() / 1000
    ) + RESET_TOKEN_TTL_SECONDS;

  /*
   * The token contains a fingerprint of the
   * current password hash.
   *
   * When the password changes, the fingerprint
   * changes and the old reset token becomes invalid.
   */

  const passwordFingerprint =
    crypto
      .createHash("sha256")
      .update(passwordHash)
      .digest("hex")
      .slice(0, 32);

  const payload = {
    userId,
    expiresAt,
    passwordFingerprint,
  };

  const encodedPayload =
    Buffer.from(
      JSON.stringify(payload)
    ).toString("base64url");

  const signature =
    crypto
      .createHmac(
        "sha256",
        getResetTokenSecret()
      )
      .update(encodedPayload)
      .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifyPasswordResetToken(
  token: string
) {
  const parts =
    token.split(".");

  if (parts.length !== 2) {
    throw new Error(
      "Invalid or expired reset link"
    );
  }

  const encodedPayload = parts[0];
  const signature = parts[1];

  if (!encodedPayload || !signature) {
    throw new Error(
      "Invalid or expired reset link"
    );
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        getResetTokenSecret()
      )
      .update(encodedPayload)
      .digest("base64url");

  const providedBuffer =
    Buffer.from(
      signature,
      "utf8"
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  if (
    providedBuffer.length !==
      expectedBuffer.length ||
    !crypto.timingSafeEqual(
      providedBuffer,
      expectedBuffer
    )
  ) {
    throw new Error(
      "Invalid or expired reset link"
    );
  }

  let payload: {
    userId: number;
    expiresAt: number;
    passwordFingerprint: string;
  };

  try {
    payload = JSON.parse(
      Buffer.from(
        encodedPayload,
        "base64url"
      ).toString("utf8")
    );
  } catch {
    throw new Error(
      "Invalid or expired reset link"
    );
  }

  if (
    !Number.isInteger(
      payload.userId
    ) ||
    !Number.isInteger(
      payload.expiresAt
    ) ||
    !payload.passwordFingerprint
  ) {
    throw new Error(
      "Invalid or expired reset link"
    );
  }

  if (
    payload.expiresAt <
    Math.floor(
      Date.now() / 1000
    )
  ) {
    throw new Error(
      "This reset link has expired"
    );
  }

  return payload;
}

/* ==========================================================
   REGISTER STUDENT
========================================================== */

export async function registerStudent(
  input: RegisterInput
) {
  const existingUser =
    await db.orm.public.User.first({
      email: input.email,
    });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists"
    );
  }

  const passwordHash =
    await bcrypt.hash(
      input.password,
      12
    );

  const result =
    await db.transaction(
      async (tx) => {
        const user =
          await tx.orm.public.User.create({
            name: input.name,
            email: input.email,
            phone: input.phone,
            passwordHash,
            role: "STUDENT",
            isActive: true,
          });

        const studentId =
          `SKCE-${String(
            user.id
          ).padStart(6, "0")}`;

        const studentProfile =
          await tx.orm.public.StudentProfile.create(
            {
              userId: user.id,
              studentId,

              state:
                input.state ||
                null,

              referralId:
                input.referralId ||
                null,

              dateOfBirth:
                input.dateOfBirth ||
                null,

              gender:
                input.gender ||
                null,

              qualification:
                input.qualification ||
                null,

              organization:
                input.organization ||
                null,

              guardianName:
                input.guardianName ||
                null,

              guardianRelationship:
                input.guardianRelationship ||
                null,

              guardianMobile:
                input.guardianMobile ||
                null,

              guardianWhatsapp:
                input.guardianWhatsapp ||
                null,

              guardianEmail:
                input.guardianEmail ||
                null,

              deviceTypes:
                input.deviceTypes ||
                null,

              internetFacility:
                input.internetFacility ||
                null,

              preferredClassApp:
                input.preferredClassApp ||
                null,

              address:
                input.address ||
                null,

              city:
                input.city ||
                null,

              pin:
                input.pin ||
                null,

              referralSource:
                input.referralSource ||
                null,

              referralName:
                input.referralName ||
                null,

              referralMobile:
                input.referralMobile ||
                null,

              declarationAccepted:
                input.declarationAccepted,
            }
          );

        return {
          user,
          studentProfile,
        };
      }
    );

  return {
    user: {
      id:
        result.user.id,

      name:
        result.user.name,

      email:
        result.user.email,

      phone:
        result.user.phone,

      role:
        result.user.role,
    },

    student: {
      id:
        result.studentProfile.id,

      studentId:
        result.studentProfile.studentId,

      state:
        result.studentProfile.state,

      referralId:
        result.studentProfile.referralId,
    },
  };
}

/* ==========================================================
   LOGIN
========================================================== */

export async function loginUser(
  input: LoginInput
) {
  const user =
    await db.orm.public.User.first({
      email: input.email,
    });

  if (
    !user ||
    !user.passwordHash
  ) {
    throw new Error(
      "Invalid email or password"
    );
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is inactive"
    );
  }

  const passwordMatches =
    await bcrypt.compare(
      input.password,
      user.passwordHash
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid email or password"
    );
  }

  const token =
    generateAccessToken({
      userId: user.id,
      role: user.role,
    });

  let student = null;

  if (
    user.role ===
    "STUDENT"
  ) {
    const studentProfile =
      await db.orm.public.StudentProfile.first(
        {
          userId: user.id,
        }
      );

    if (studentProfile) {
      student = {
        id:
          studentProfile.id,

        studentId:
          studentProfile.studentId,

        state:
          studentProfile.state,

        referralId:
          studentProfile.referralId,
      };
    }
  }

  return {
    token,

    user: {
      id:
        user.id,

      name:
        user.name,

      email:
        user.email,

      phone:
        user.phone,

      role:
        user.role,
    },

    student,
  };
}

/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export async function requestPasswordReset(
  email: string
) {
  const user =
    await db.orm.public.User.first({
      email,
    });

  /*
   * Do not reveal whether an email exists.
   */
  if (
    !user ||
    !user.passwordHash
  ) {
    return;
  }

  const token =
    createPasswordResetToken(
      user.id,
      user.passwordHash
    );

  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  const resetUrl =
    `${frontendUrl}/reset-password?token=${encodeURIComponent(
      token
    )}`;

  /*
   * Build the password reset email.
   */
  const emailContent =
    buildPasswordResetEmail({
      userName:
        user.name,

      resetUrl,
    });

  /*
   * Send the reset link only to the
   * registered email address.
   */
  await sendEmail({
    to:
      user.email,

    subject:
      "Reset Your Password - SK Computer Education",

    html:
      emailContent.html,

    text:
      emailContent.text,
  });
}

/* ==========================================================
   RESET PASSWORD
========================================================== */

export async function resetPassword(
  token: string,
  newPassword: string
) {
  const payload =
    verifyPasswordResetToken(
      token
    );

  /*
   * Fetch the user fresh from the database.
   */

  const user =
    await db.orm.public.User.first({
      id:
        payload.userId,
    });

  if (
    !user ||
    !user.passwordHash
  ) {
    throw new Error(
      "Invalid or expired reset link"
    );
  }

  /*
   * Check that the reset token was created
   * against the current password.
   */

  const currentFingerprint =
    crypto
      .createHash("sha256")
      .update(
        user.passwordHash
      )
      .digest("hex")
      .slice(0, 32);

  if (
    currentFingerprint !==
    payload.passwordFingerprint
  ) {
    throw new Error(
      "This reset link has already been used or is no longer valid"
    );
  }

  /*
   * Hash the NEW password.
   */

  const newPasswordHash =
    await bcrypt.hash(
      newPassword,
      12
    );

  /*
   * ==========================================================
   * UPDATE USER
   * ==========================================================
   */

  await db.orm.public.User
    .where({
      id:
        user.id,
    })
    .update({
      passwordHash:
        newPasswordHash,
    });

  /*
   * ==========================================================
   * VERIFY DATABASE UPDATE
   * ==========================================================
   *
   * Fetch the user again rather than trusting
   * the object returned from update().
   */

  const updatedUser =
    await db.orm.public.User.first({
      id:
        user.id,
    });

  if (
    !updatedUser ||
    !updatedUser.passwordHash
  ) {
    throw new Error(
      "Password update could not be completed"
    );
  }

  /*
   * Make sure the NEW password works against
   * the hash that is actually stored in the DB.
   */

  const newPasswordMatches =
    await bcrypt.compare(
      newPassword,
      updatedUser.passwordHash
    );

  if (!newPasswordMatches) {
    throw new Error(
      "Password update verification failed"
    );
  }

  /*
   * Make sure the OLD password no longer works.
   */

  const oldPasswordMatches =
    await bcrypt.compare(
      newPassword,
      user.passwordHash
    );

  /*
   * This variable intentionally checks the old
   * hash only against the new password.
   *
   * The actual old password is never available here.
   */

  console.log(
    "[SKCE PASSWORD RESET] User password hash updated successfully:",
    {
      userId: user.id,
      hashChanged:
        user.passwordHash !==
        updatedUser.passwordHash,
      newPasswordVerified:
        newPasswordMatches,
      previousHashStillInRecord:
        oldPasswordMatches,
    }
  );

  return {
    success: true,
  };
}