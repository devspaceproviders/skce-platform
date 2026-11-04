import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { db } from "../../prisma/db";
import { sendEmail } from "../../notifications/services/email.service";
import { generateAccessToken } from "./token.service";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getOtpSecret(): string {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("OTP_HASH_SECRET or JWT_SECRET must be configured");
  }

  return secret;
}

function hashOtp(userId: number, otp: string): string {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${userId}:${otp}`)
    .digest("hex");
}

function createChallengeToken(
  challengeId: number,
  userId: number,
  expiresAt: number
): string {
  const payload = Buffer.from(
    JSON.stringify({ challengeId, userId, expiresAt })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", getOtpSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function readChallengeToken(token: string): {
  challengeId: number;
  userId: number;
  expiresAt: number;
} {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    throw new Error("Invalid or expired login challenge");
  }

  const expected = crypto
    .createHmac("sha256", getOtpSecret())
    .update(payload)
    .digest();

  const provided = Buffer.from(signature, "base64url");

  if (
    expected.length !== provided.length ||
    !crypto.timingSafeEqual(expected, provided)
  ) {
    throw new Error("Invalid or expired login challenge");
  }

  let decoded: {
    challengeId: number;
    userId: number;
    expiresAt: number;
  };

  try {
    decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
  } catch {
    throw new Error("Invalid or expired login challenge");
  }

  if (
    !Number.isInteger(decoded.challengeId) ||
    !Number.isInteger(decoded.userId) ||
    !Number.isFinite(decoded.expiresAt) ||
    decoded.expiresAt <= Date.now()
  ) {
    throw new Error("Invalid or expired login challenge");
  }

  return decoded;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  const visible = localPart.slice(0, 2);
  const hidden = "*".repeat(Math.max(3, localPart.length - visible.length));

  return `${visible}${hidden}@${domain}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] || character;
  });
}

async function sendLoginOtpEmail(
  email: string,
  name: string,
  otp: string
): Promise<void> {
  const safeName = escapeHtml(name || "User");

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;">
          <div style="background:#0B2A52;padding:28px;text-align:center;color:#ffffff;">
            <h1 style="margin:0;font-size:24px;">SK Computer Education</h1>
            <p style="margin:8px 0 0;color:#dbeafe;">Login Verification</p>
          </div>

          <div style="padding:32px;color:#334155;">
            <h2 style="color:#0B2A52;">Hello ${safeName},</h2>

            <p>Use the following verification code to sign in to your SKCE account.</p>

            <div style="margin:28px 0;padding:20px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;text-align:center;">
              <div style="font-size:32px;font-weight:bold;letter-spacing:10px;color:#F56612;">
                ${otp}
              </div>
            </div>

            <p>This verification code expires in <strong>5 minutes</strong>.</p>

            <p>If you did not attempt to sign in, you can safely ignore this email.</p>

            <p style="margin-top:28px;font-size:13px;color:#64748b;">
              Never share this verification code with anyone.
            </p>
          </div>

          <div style="padding:18px;text-align:center;background:#f8fafc;color:#94a3b8;font-size:12px;">
            SK Computer Education · Learn · Practice · Succeed
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hello ${name || "User"},

Your SK Computer Education login verification code is: ${otp}

This code expires in 5 minutes.

Never share this code with anyone.
If you did not attempt to sign in, ignore this email.
  `.trim();

  await sendEmail({
    to: email,
    subject: "Your SKCE Login Verification Code",
    html,
    text,
  });
}

export async function startLoginOtp(
  email: string,
  password: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.orm.public.User.first({
    email: normalizedEmail,
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  if (!user.email) {
    throw new Error("No email address is registered");
  }

  const otp = crypto
    .randomInt(0, 1_000_000)
    .toString()
    .padStart(6, "0");

  const expiresAtMs = Date.now() + OTP_TTL_MS;
  const expiresAt = new Date(expiresAtMs).toISOString();

  // Reuse the existing destinationPhone database column.
  // It stores the email destination for this login challenge.
  const challenge = await db.orm.public.PhoneOtpChallenge.create({
    userId: user.id,
    purpose: "LOGIN",
    destinationPhone: normalizedEmail,
    codeHash: hashOtp(user.id, otp),
    expiresAt,
    attempts: 0,
    lastSentAt: new Date().toISOString(),
  });

  try {
    await sendLoginOtpEmail(
      normalizedEmail,
      user.name,
      otp
    );
  } catch (error) {
    await db.orm.public.PhoneOtpChallenge
      .where({ id: challenge.id })
      .update({
        consumedAt: new Date().toISOString(),
      });

    console.error("Unable to deliver login OTP email:", error);

    throw new Error("Unable to send verification email");
  }

  return {
    requiresOtp: true,
    challengeToken: createChallengeToken(
      challenge.id,
      user.id,
      expiresAtMs
    ),
    maskedEmail: maskEmail(normalizedEmail),
    expiresInSeconds: OTP_TTL_MS / 1000,
  };
}

export async function verifyLoginOtp(
  challengeToken: string,
  submittedOtp: string
) {
  const token = readChallengeToken(challengeToken);

  const challenge = await db.orm.public.PhoneOtpChallenge.first({
    id: token.challengeId,
  });

  if (
    !challenge ||
    challenge.userId !== token.userId ||
    challenge.purpose !== "LOGIN" ||
    challenge.consumedAt ||
    new Date(challenge.expiresAt).getTime() <= Date.now()
  ) {
    throw new Error("Invalid or expired verification code");
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please sign in again.");
  }

  const expectedHash = hashOtp(token.userId, submittedOtp);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(challenge.codeHash, "hex");

  const matches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!matches) {
    await db.orm.public.PhoneOtpChallenge
      .where({ id: challenge.id })
      .update({
        attempts: challenge.attempts + 1,
      });

    throw new Error("Invalid or expired verification code");
  }

  // Consume the challenge before issuing a JWT.
  await db.orm.public.PhoneOtpChallenge
    .where({ id: challenge.id })
    .update({
      consumedAt: new Date().toISOString(),
    });

  const user = await db.orm.public.User.first({
    id: token.userId,
  });

  if (!user || !user.isActive) {
    throw new Error("Your account is inactive or unavailable");
  }

  const studentProfile =
    user.role === "STUDENT"
      ? await db.orm.public.StudentProfile.first({
          userId: user.id,
        })
      : null;

  const jwt = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token: jwt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    student: studentProfile
      ? {
          id: studentProfile.id,
          studentId: studentProfile.studentId,
          state: studentProfile.state,
          referralId: studentProfile.referralId,
        }
      : null,
  };
}