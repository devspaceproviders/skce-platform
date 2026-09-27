import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  addStudentToBatchController,
  createAdminBatchController,
  deleteAdminBatchController,
  getAdminBatchController,
  getAdminBatchOptionsController,
  getAdminBatchStudentsController,
  getTrainerBatchController,
  getTrainerBatchStudentsController,
  listAdminBatchesController,
  listTrainerBatchesController,
  removeStudentFromBatchController,
  updateAdminBatchController,
} from "../controllers/batch.controller";

const adminBatchRouter =
  Router();

adminBatchRouter.use(
  authenticate,
  requireRole("ADMIN")
);

adminBatchRouter.get(
  "/",
  listAdminBatchesController
);

adminBatchRouter.get(
  "/options",
  getAdminBatchOptionsController
);

adminBatchRouter.get(
  "/:id/students",
  getAdminBatchStudentsController
);

adminBatchRouter.post(
  "/:id/students",
  addStudentToBatchController
);

adminBatchRouter.delete(
  "/:id/students/:studentId",
  removeStudentFromBatchController
);

adminBatchRouter.get(
  "/:id",
  getAdminBatchController
);

adminBatchRouter.post(
  "/",
  createAdminBatchController
);

adminBatchRouter.patch(
  "/:id",
  updateAdminBatchController
);

adminBatchRouter.delete(
  "/:id",
  deleteAdminBatchController
);

const trainerBatchRouter =
  Router();

trainerBatchRouter.use(
  authenticate,
  requireRole("TRAINER")
);

trainerBatchRouter.get(
  "/",
  listTrainerBatchesController
);

trainerBatchRouter.get(
  "/:id/students",
  getTrainerBatchStudentsController
);

trainerBatchRouter.get(
  "/:id",
  getTrainerBatchController
);

export {
  adminBatchRouter,
  trainerBatchRouter,
};

export default adminBatchRouter;
