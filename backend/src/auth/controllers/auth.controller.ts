import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import type { Request, Response } from "express";

import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator";

import {
  loginUser,
  registerStudent,
} from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await registerStudent(validation.data);

    return res.status(201).json({
      success: true,
      message: "Student registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete registration";

    if (message === "An account with this email already exists") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to complete registration",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await loginUser(validation.data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to login";

    if (message === "Invalid email or password") {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (message === "Your account is inactive") {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authenticated user",
      data: {
        userId: req.user.userId,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve authenticated user",
    });
  }
}