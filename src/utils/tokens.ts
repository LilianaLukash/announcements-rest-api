import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken(token: string): { sub: number } {
  const decoded = jwt.verify(token, getJwtSecret()) as unknown as {
    sub: number;
  };

  if (typeof decoded.sub !== "number") {
    throw new Error("Invalid token payload");
  }

  return decoded;
}
