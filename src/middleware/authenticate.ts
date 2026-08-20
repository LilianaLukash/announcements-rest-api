import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type JwtPayload = {
  sub: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Internal server error" });
    }

    const decoded = jwt.verify(token, secret) as unknown as JwtPayload;

    if (typeof decoded.sub !== "number") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = { sub: decoded.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
