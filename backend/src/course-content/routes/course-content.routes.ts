import { Router } from "express";
import { getCourseContent } from "../controllers/course-content.controller";
import { authenticate } from "../../auth/middleware/auth.middleware";
import { requireRole } from "../../auth/middleware/role.middleware";

const router = Router();

router.get(
  "/:courseId",
  authenticate,
  requireRole("STUDENT"),
  getCourseContent
);

export default router;