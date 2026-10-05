import { Router } from "express";

import {
  getPublicHomepagePopup,
} from "../controllers/homepage-popup.controller";

const router = Router();

router.get(
  "/",
  getPublicHomepagePopup
);

export default router;