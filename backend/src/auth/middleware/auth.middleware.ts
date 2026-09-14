import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type UserRole = "ADMIN" | "STUDENT" | "TRAINER";

export type AuthenticatedUser = {
  userId: number;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    // Authorization header is required
    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Expected format:
    // Authorization: Bearer <token>
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, getJwtSecret());

    // JWT payload must be an object
    if (typeof decoded === "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const userId = decoded.userId;
    const role = decoded.role;

    // Validate userId
    if (typeof userId !== "number") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Validate role
    if (
      role !== "ADMIN" &&
      role !== "STUDENT" &&
      role !== "TRAINER"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Attach authenticated user to request
    req.user = {
      userId,
      role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}