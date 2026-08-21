import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/tokens.ts";

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
    const decoded = verifyToken(token);
    req.user = { sub: decoded.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
