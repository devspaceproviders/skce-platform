import { Router } from "express";

import {
  getPackage,
  getPackages,
} from "../controllers/package.controller";

const router = Router();

router.get("/", getPackages);

router.get("/:slug", getPackage);

export default router;