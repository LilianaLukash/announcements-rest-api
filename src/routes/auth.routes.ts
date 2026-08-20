import { Router } from "express";
import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { validateBody } from "../middleware/validate.ts";
import { registry } from "../openapi.ts";
import {
  authTokensResponseSchema,
  loginSchema,
  refreshSchema,
  refreshTokensResponseSchema,
  registerSchema,
  userProfileSchema,
} from "../validators/auth.validator.ts";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered",
      content: {
        "application/json": {
          schema: authTokensResponseSchema,
        },
      },
    },
    400: { description: "Validation failed" },
    409: { description: "Username or email already taken" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Logged in",
      content: {
        "application/json": {
          schema: authTokensResponseSchema,
        },
      },
    },
    400: { description: "Validation failed" },
    401: { description: "Invalid credentials" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: refreshSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tokens refreshed",
      content: {
        "application/json": {
          schema: refreshTokensResponseSchema,
        },
      },
    },
    400: { description: "Validation failed" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout",
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "Logged out" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Current user profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current user",
      content: {
        "application/json": {
          schema: userProfileSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
