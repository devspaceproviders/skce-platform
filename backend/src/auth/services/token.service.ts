import jwt from "jsonwebtoken";

type AccessTokenPayload = {
  userId: number;
  role: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    getJwtSecret(),
    {
      expiresIn: "1h",
    }
  );
}