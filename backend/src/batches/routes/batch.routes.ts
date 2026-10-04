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

import {
  getTrainerBatchStudentDetailsController,
} from "../controllers/trainer-batch-student.controller";

const adminBatchRouter = Router();

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

const trainerBatchRouter = Router();

trainerBatchRouter.use(
  authenticate,
  requireRole("TRAINER")
);

trainerBatchRouter.get(
  "/",
  listTrainerBatchesController
);

/*
 * IMPORTANT:
 * This route must be before "/:id".
 * It is the Trainer-only student details endpoint.
 */
trainerBatchRouter.get(
  "/:batchId/students/:studentId",
  getTrainerBatchStudentDetailsController
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
