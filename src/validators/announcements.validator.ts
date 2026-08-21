import { z } from "zod";
import { registry } from "../openapi.ts";
import { userPublicSchema } from "./auth.validator.ts";

export const announcementCategories = [
  "sale",
  "service",
  "job",
  "other",
] as const;

export const createAnnouncementSchema = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  category: z.enum(announcementCategories),
});

export const updateAnnouncementBodySchema = createAnnouncementSchema.partial();

export const updateAnnouncementSchema = updateAnnouncementBodySchema.refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided",
  },
);

export const announcementIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listAnnouncementsQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
});

export const announcementSchema = registry.register(
  "Announcement",
  z.object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    price: z.number(),
    category: z.enum(announcementCategories),
    imageUrl: z.string().url().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: userPublicSchema,
  }),
);

export const announcementsListSchema = registry.register(
  "AnnouncementsList",
  z.object({
    data: z.array(announcementSchema),
    pagination: z.object({
      total: z.number().int(),
      page: z.number().int(),
      totalPages: z.number().int(),
      perPage: z.number().int(),
    }),
  }),
);

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<
  typeof updateAnnouncementBodySchema
>;
export type ListAnnouncementsQuery = z.infer<
  typeof listAnnouncementsQuerySchema
>;
