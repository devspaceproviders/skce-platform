import type {
  Request,
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

import {
  loginUser,
  registerStudent,
  requestPasswordReset,
  resetPassword,
} from "../services/auth.service";

/* ==========================================================
   REGISTER
========================================================== */

export async function register(
  req: Request,
  res: Response
) {
  try {
    const validation =
      registerSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid registration details",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
    }

    const result =
      await registerStudent(
        validation.data
      );

    return res.status(201).json({
      success: true,
      message:
        "Student registration successful",
      data: result,
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete registration";

    if (
      message ===
      "An account with this email already exists"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete registration",
    });
  }
}

/* ==========================================================
   LOGIN
========================================================== */

export async function login(
  req: Request,
  res: Response
) {
  try {
    const validation =
      loginSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid login details",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
    }

    const result =
      await loginUser(
        validation.data
      );

    return res.status(200).json({
      success: true,
      message:
        "Login successful",
      data: result,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to login";

    if (
      message ===
      "Invalid email or password"
    ) {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Your account is inactive"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to login",
    });
  }
}

/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export async function forgotPassword(
  req: Request,
  res: Response
) {
  try {
    const validation =
      forgotPasswordSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
    }

    const result =
      await requestPasswordReset(
        validation.data.email
      );

    /*
     * Always return the same public message.
     */

    return res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, password reset instructions have been prepared.",
      data:
        process.env.NODE_ENV !==
        "production"
          ? {
              resetUrl:
                result.resetUrl,
            }
          : undefined,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    /*
     * Do not expose internal details.
     */

    return res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, password reset instructions have been prepared.",
    });
  }
}

/* ==========================================================
   RESET PASSWORD
========================================================== */

export async function resetPasswordController(
  req: Request,
  res: Response
) {
  try {
    const validation =
      resetPasswordSchema.safeParse(
        req.body
      );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset details",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
    }

    await resetPassword(
      validation.data.token,
      validation.data.password
    );

    return res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to reset password";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

/* ==========================================================
   GET ME
========================================================== */

export async function getMe(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Authenticated user",
      data: {
        userId:
          req.user.userId,

        role:
          req.user.role,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve authenticated user",
    });
  }
}