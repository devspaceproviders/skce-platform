import { Router } from "express";

import {
  getCourse,
  getCourses,
} from "../controllers/course.controller";

const router = Router();

router.get("/", getCourses);

router.get("/:slug", getCourse);

export default router;