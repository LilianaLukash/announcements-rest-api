import type { Request, Response, NextFunction } from "express";
import type { Prisma } from "../../generated/prisma/client.ts";
import prisma from "../../prisma/client.ts";
import logger from "../logger.ts";
import { uploadImageToCloudinary } from "../utils/cloudinary.ts";
import type {
  CreateAnnouncementInput,
  ListAnnouncementsQuery,
  UpdateAnnouncementInput,
} from "../validators/announcements.validator.ts";

const PER_PAGE = 10;

const announcementSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
    },
  },
} as const;

export async function listAnnouncements(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { search, sort, page } =
      req.query as unknown as ListAnnouncementsQuery;

    const where: Prisma.AnnouncementWhereInput = {};

    if (search && search.trim() !== "") {
      where.title = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const orderBy: Prisma.AnnouncementOrderByWithRelationInput = {
      createdAt: sort === "oldest" ? "asc" : "desc",
    };

    const skip = (page - 1) * PER_PAGE;

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy,
        skip,
        take: PER_PAGE,
        select: announcementSelect,
      }),
      prisma.announcement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / PER_PAGE);

    return res.status(200).json({
      data,
      pagination: {
        total,
        page,
        totalPages,
        perPage: PER_PAGE,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: announcementSelect,
    });

    if (!announcement) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.status(200).json(announcement);
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = req.body as CreateAnnouncementInput;
    const userId = req.user!.sub;

    let imageUrl: string | undefined;

    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.path);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        description: body.description,
        price: body.price,
        category: body.category,
        imageUrl,
        userId,
      },
      select: announcementSelect,
    });

    logger.info(
      { announcementId: announcement.id, userId, hasImage: Boolean(imageUrl) },
      "Announcement created",
    );

    return res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const body = req.body as UpdateAnnouncementInput;
    const userId = req.user!.sub;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (announcement.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    let imageUrl: string | undefined;

    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.path);
      logger.info(
        { announcementId: id, userId },
        "Announcement photo uploaded",
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...body,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
      select: announcementSelect,
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.sub;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (announcement.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}
