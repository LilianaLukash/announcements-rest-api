import { beforeAll, describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "../src/utils/password.ts";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../src/utils/tokens.ts";
import { createAnnouncementSchema } from "../src/validators/announcements.validator.ts";

beforeAll(() => {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? "test-secret-key-for-vitest";
});

describe("password hashing", () => {
  it("hashes a password and verifies it with comparePassword", async () => {
    const password = "secret123";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword("wrong-password", hash)).toBe(false);
  });
});

describe("token generation", () => {
  it("creates a valid access token with user id in sub", () => {
    const token = signAccessToken(42);
    const decoded = verifyToken(token);

    expect(typeof token).toBe("string");
    expect(decoded.sub).toBe(42);
  });

  it("creates a refresh token that can be verified", () => {
    const token = signRefreshToken(7);
    const decoded = verifyToken(token);

    expect(decoded.sub).toBe(7);
  });
});

describe("announcement validation", () => {
  it("accepts valid announcement payload including string price from multipart", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Sell mountain bike",
      description: "Great condition, 21 speeds",
      price: "8500",
      category: "sale",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(8500);
    }
  });

  it("rejects announcement with too short title", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Bike",
      description: "Great condition, 21 speeds",
      price: 8500,
      category: "sale",
    });

    expect(result.success).toBe(false);
  });
});
