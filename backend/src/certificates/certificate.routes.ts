import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../auth/middleware/auth.middleware";

import {
  getStudentCertificatesController,
  regenerateStudentCertificateController,
} from "./certificate.controller";

const certificateRouter = Router();

certificateRouter.get(
  "/",
  authenticate,
  requireRole("STUDENT"),
  getStudentCertificatesController
);

certificateRouter.post(
  "/:id/regenerate",
  authenticate,
  requireRole("STUDENT"),
  regenerateStudentCertificateController
);

export default certificateRouter;