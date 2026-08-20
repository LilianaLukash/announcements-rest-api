import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.ts";
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
} from "../validators/auth.validator.ts";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 10;

const userPublicSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
} as const;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function signAccessToken(userId: number): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function signRefreshToken(userId: number): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

async function createTokenPair(userId: number) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
    },
  });

  return { accessToken, refreshToken };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { username, email, password, name } = req.body as RegisterInput;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Username or email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
      },
      select: userPublicSelect,
    });

    const tokens = await createTokenPair(user.id);

    return res.status(201).json({
      user,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    const tokens = await createTokenPair(user.id);

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as RefreshInput;

    let decoded: { sub: number };

    try {
      decoded = jwt.verify(refreshToken, getJwtSecret()) as unknown as {
        sub: number;
      };
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof decoded.sub !== "number") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    const tokens = await createTokenPair(decoded.sub);

    return res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}
