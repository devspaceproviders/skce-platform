import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";

type UserRole =
  | "ADMIN"
  | "STUDENT"
  | "TRAINER";

export type AuthenticatedUser = {
  userId: number;
  role: UserRole;
};

export type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return secret;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [scheme, token] =
      authorization.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    if (typeof decoded === "string") {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    const userId = decoded.userId;
    const role = decoded.role;

    if (
      typeof userId !== "number"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    if (
      role !== "ADMIN" &&
      role !== "STUDENT" &&
      role !== "TRAINER"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    req.user = {
      userId,
      role,
    };

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token has expired",
      });
    }

    if (
      error instanceof
      jwt.JsonWebTokenError
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

export function requireRole(
  ...allowedRoles: UserRole[]
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
}
