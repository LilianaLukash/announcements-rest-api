import { Router } from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../controllers/announcements.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";
import { registry } from "../openapi.ts";
import {
  announcementIdParamSchema,
  announcementSchema,
  announcementsListSchema,
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
  updateAnnouncementBodySchema,
  updateAnnouncementSchema,
} from "../validators/announcements.validator.ts";

const router = Router();

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
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createAnnouncementSchema,
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
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateAnnouncementBodySchema,
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
  validateBody(createAnnouncementSchema),
  createAnnouncement,
);
router.patch(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement,
);
router.delete(
  "/:id",
  authenticate,
  validateParams(announcementIdParamSchema),
  deleteAnnouncement,
);

export default router;
