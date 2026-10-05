import { Router } from "express";
import {
  changeContactMessageStatus,
  changeDemoRequestStatus,
  getContactMessages,
  getDemoRequests,
  getPublicContactSettings,
  getPublicCourses,
  submitContactMessage,
  submitDemoRequest,
  updatePublicContactSettings,
} from "../controllers/contact.controller";

const router = Router();

/* -------------------------------------------------------------------------- */
/* PUBLIC                                                                     */
/* -------------------------------------------------------------------------- */

router.get("/settings", getPublicContactSettings);

router.get("/courses", getPublicCourses);

router.post("/demo-booking", submitDemoRequest);

router.post("/message", submitContactMessage);

/* -------------------------------------------------------------------------- */
/* ADMIN                                                                      */
/* -------------------------------------------------------------------------- */

router.put("/settings", updatePublicContactSettings);

router.get("/admin/demo-requests", getDemoRequests);

router.patch(
  "/admin/demo-requests/:id/status",
  changeDemoRequestStatus
);

router.get("/admin/messages", getContactMessages);

router.patch(
  "/admin/messages/:id/status",
  changeContactMessageStatus
);

export default router;