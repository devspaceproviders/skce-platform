import { Router } from "express";
import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";
import {
  createAdminLiveSessionController,
  createTrainerLiveSessionController,
  deleteAdminLiveSessionController,
  deleteTrainerLiveSessionController,
  getAdminLiveSession,
  getStudentLiveSessionController,
  getTrainerLiveSessionController,
  joinStudentLiveSessionController,
  leaveStudentLiveSessionController,
  listAdminLiveSessions,
  listAdminSessionParticipants,
  listLiveSessionOptions,
  listStudentLiveSessionsController,
  listTrainerLiveSessionsController,
  listTrainerSessionParticipants,
  updateAdminLiveSessionController,
  updateTrainerLiveSessionController,
} from "../controllers/live-session.controller";

const liveSessionRoutes = Router();

liveSessionRoutes.use(authenticate, requireRole("STUDENT"));

liveSessionRoutes.get("/", listStudentLiveSessionsController);
liveSessionRoutes.get("/:id", getStudentLiveSessionController);
liveSessionRoutes.post("/:id/join", joinStudentLiveSessionController);
liveSessionRoutes.post("/:id/leave", leaveStudentLiveSessionController);

export const adminLiveSessionRouter = Router();

adminLiveSessionRouter.use(authenticate, requireRole("ADMIN"));

adminLiveSessionRouter.get("/options", listLiveSessionOptions);
adminLiveSessionRouter.get("/", listAdminLiveSessions);
adminLiveSessionRouter.get("/:id", getAdminLiveSession);
adminLiveSessionRouter.get("/:id/participants", listAdminSessionParticipants);
adminLiveSessionRouter.post("/", createAdminLiveSessionController);
adminLiveSessionRouter.patch("/:id", updateAdminLiveSessionController);
adminLiveSessionRouter.delete("/:id", deleteAdminLiveSessionController);

export const trainerLiveSessionRouter = Router();

trainerLiveSessionRouter.use(authenticate, requireRole("TRAINER"));

trainerLiveSessionRouter.get("/", listTrainerLiveSessionsController);
trainerLiveSessionRouter.get("/:id", getTrainerLiveSessionController);
trainerLiveSessionRouter.get("/:id/participants", listTrainerSessionParticipants);
trainerLiveSessionRouter.post("/", createTrainerLiveSessionController);
trainerLiveSessionRouter.patch("/:id", updateTrainerLiveSessionController);
trainerLiveSessionRouter.delete("/:id", deleteTrainerLiveSessionController);

export default liveSessionRoutes;
