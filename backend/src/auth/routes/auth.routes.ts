import { Router } from "express";

import {
  getMe,
  login,
  register,
  forgotPassword,
  resetPasswordController,
} from "../controllers/auth.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

const router = Router();

/* ==========================================================
   PUBLIC AUTH ROUTES
========================================================== */

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordController
);

/* ==========================================================
   AUTHENTICATED USER
========================================================== */

router.get(
  "/me",
  authenticate,
  getMe
);

export default router;