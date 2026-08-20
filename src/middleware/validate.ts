import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

function formatZodError(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key =
      issue.path.length > 0
        ? issue.path.map(String).join(".")
        : "_root";
    if (!details[key]) {
      details[key] = [];
    }
    details[key].push(issue.message);
  }

  return details;
}

function replaceRequestProperty(
  req: Request,
  key: "query" | "params" | "body",
  value: unknown,
) {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
    }

    replaceRequestProperty(req, "body", result.data);
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
    }

    replaceRequestProperty(req, "params", result.data);
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
    }

    replaceRequestProperty(req, "query", result.data);
    next();
  };
}
