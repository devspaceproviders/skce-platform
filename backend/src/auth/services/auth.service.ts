import bcrypt from "bcryptjs";

import { db } from "../../prisma/db";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator";
import { generateAccessToken } from "./token.service";

export async function registerStudent(input: RegisterInput) {
  // Check whether the email is already registered
  const existingUser = await db.orm.public.User.first({
    email: input.email,
  });

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  // Hash password before storing it
  const passwordHash = await bcrypt.hash(input.password, 12);

  /*
   * Create User and StudentProfile inside a transaction.
   */
  const result = await db.transaction(async (tx) => {
    // Create user
    const user = await tx.orm.public.User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: "STUDENT",
      isActive: true,
    });

    // Generate Student ID
    const studentId = `SKCE-${String(user.id).padStart(6, "0")}`;

    // Create student profile
    const studentProfile =
      await tx.orm.public.StudentProfile.create({
        userId: user.id,
        studentId,
        state: input.state ?? null,
        referralId: input.referralId ?? null,
      });

    return {
      user,
      studentProfile,
    };
  });

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
    },

    student: {
      id: result.studentProfile.id,
      studentId: result.studentProfile.studentId,
      state: result.studentProfile.state,
      referralId: result.studentProfile.referralId,
    },
  };
}

/**
 * Login student/user
 */
export async function loginUser(input: LoginInput) {
  // Find user by email
  const user = await db.orm.public.User.first({
    email: input.email,
  });

  // Do not reveal whether the email exists
  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  // Check account status
  if (!user.isActive) {
    throw new Error("Your account is inactive");
  }

  // Compare entered password with stored bcrypt hash
  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT
  const token = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  // Get student profile if this is a student
  let student = null;

  if (user.role === "STUDENT") {
    const studentProfile =
      await db.orm.public.StudentProfile.first({
        userId: user.id,
      });

    if (studentProfile) {
      student = {
        id: studentProfile.id,
        studentId: studentProfile.studentId,
        state: studentProfile.state,
        referralId: studentProfile.referralId,
      };
    }
  }

  return {
    token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },

    student,
  };
}