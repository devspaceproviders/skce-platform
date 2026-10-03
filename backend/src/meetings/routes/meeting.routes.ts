import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  cancelAdminMeetingController,
  cancelTrainerMeetingController,
  createAdminMeetingController,
  createTrainerMeetingController,
  deleteAdminMeetingController,
  deleteTrainerMeetingController,
  getAdminMeetingController,
  getStudentMeetingController,
  getTrainerMeetingController,
  getTrainerMeetingOptionsController,
  listAdminMeetingsController,
  listStudentMeetingsController,
  listTrainerMeetingsController,
  updateAdminMeetingController,
  updateTrainerMeetingController,
} from "../controllers/meeting.controller";

const meetingRoutes = Router();

meetingRoutes.use(
  authenticate,
  requireRole("STUDENT")
);

meetingRoutes.get(
  "/",
  listStudentMeetingsController
);

meetingRoutes.get(
  "/:id",
  getStudentMeetingController
);

export const adminMeetingRouter = Router();

adminMeetingRouter.use(
  authenticate,
  requireRole("ADMIN")
);

adminMeetingRouter.get(
  "/",
  listAdminMeetingsController
);

adminMeetingRouter.get(
  "/:id",
  getAdminMeetingController
);

adminMeetingRouter.post(
  "/",
  createAdminMeetingController
);

adminMeetingRouter.patch(
  "/:id",
  updateAdminMeetingController
);

adminMeetingRouter.post(
  "/:id/cancel",
  cancelAdminMeetingController
);

adminMeetingRouter.delete(
  "/:id",
  deleteAdminMeetingController
);

export const trainerMeetingRouter = Router();

trainerMeetingRouter.use(
  authenticate,
  requireRole("TRAINER")
);

trainerMeetingRouter.get(
  "/options",
  getTrainerMeetingOptionsController
);

trainerMeetingRouter.get(
  "/",
  listTrainerMeetingsController
);

trainerMeetingRouter.get(
  "/:id",
  getTrainerMeetingController
);

trainerMeetingRouter.post(
  "/",
  createTrainerMeetingController
);

trainerMeetingRouter.patch(
  "/:id",
  updateTrainerMeetingController
);

trainerMeetingRouter.post(
  "/:id/cancel",
  cancelTrainerMeetingController
);

trainerMeetingRouter.delete(
  "/:id",
  deleteTrainerMeetingController
);

export default meetingRoutes;
