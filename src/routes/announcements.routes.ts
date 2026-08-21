import { Router } from "express";
import { z } from "zod";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../controllers/announcements.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { upload } from "../middleware/upload.ts";
import {
  validateAnnouncementUpdate,
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import { registry } from "../openapi.ts";
import {
  announcementCategories,
  announcementIdParamSchema,
  announcementSchema,
  announcementsListSchema,
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
} from "../validators/announcements.validator.ts";

const router = Router();

const announcementMultipartFields = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  category: z.enum(announcementCategories),
  image: z
    .string()
    .optional()
    .openapi({
      type: "string",
      format: "binary",
      description: "Optional announcement photo",
    }),
});

const updateAnnouncementMultipartFields = z.object({
  title: z.string().min(5).max(50).optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  category: z.enum(announcementCategories).optional(),
  image: z
    .string()
    .optional()
    .openapi({
      type: "string",
      format: "binary",
      description: "Optional announcement photo",
    }),
});

registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "List announcements",
  request: {
    query: listAnnouncementsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated announcements",
      content: {
        "application/json": {
          schema: announcementsListSchema,
        },
      },
    },
    400: { description: "Validation failed" },
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Get announcement by id",
  request: {
    params: announcementIdParamSchema,
  },
  responses: {
    200: {
      description: "Announcement found",
      content: {
        "application/json": {
          schema: announcementSchema,
        },
      },
    },
    400: { description: "Validation failed" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Create announcement",
  description:
    "Create an announcement. Send multipart/form-data. Photo field name: image (optional).",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: announcementMultipartFields,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Announcement created",
      content: {
        "application/json": {
          schema: announcementSchema,
        },
      },
    },
    400: { description: "Validation failed" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Update announcement",
  description:
    "Partially update an announcement. Send multipart/form-data. Photo field name: image (optional). At least one field or image is required.",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: updateAnnouncementMultipartFields,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Announcement updated",
      content: {
        "application/json": {
          schema: announcementSchema,
        },
      },
    },
    400: { description: "Validation failed" },
    401: { description: "Unauthorized" },
    403: { description: "Access denied" },
    404: { description: "Not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Delete announcement",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
  },
  responses: {
    204: { description: "Announcement deleted" },
    401: { description: "Unauthorized" },
    403: { description: "Access denied" },
    404: { description: "Not found" },
  },
});

router.get(
  "/",
  validateQuery(listAnnouncementsQuerySchema),
  listAnnouncements,
);
router.get(
  "/:id",
  validateParams(announcementIdParamSchema),
  getAnnouncement,
);
router.post(
  "/",
  authenticate,
  upload.single("image"),
  validateBody(createAnnouncementSchema),
  createAnnouncement,
);
router.patch(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  upload.single("image"),
  validateAnnouncementUpdate,
  updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  deleteAnnouncement,
);

export default router;
