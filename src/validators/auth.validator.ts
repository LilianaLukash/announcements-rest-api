import { z } from "zod";
import { registry } from "../openapi.ts";

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const userPublicSchema = registry.register(
  "UserPublic",
  z.object({
    id: z.number().int(),
    username: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
);

export const userProfileSchema = registry.register(
  "UserProfile",
  userPublicSchema.extend({
    createdAt: z.string().datetime(),
  }),
);

export const authTokensResponseSchema = registry.register(
  "AuthTokensResponse",
  z.object({
    user: userPublicSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

export const refreshTokensResponseSchema = registry.register(
  "RefreshTokensResponse",
  z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
