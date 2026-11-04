import { Router } from "express";
import rateLimit from "express-rate-limit";

/*import {
  getMe,
  login,
  register,
  forgotPassword,
  resetPasswordController,
} from "../controllers/auth.controller";*/

import {
  getMe,
  login,
  verifyLogin,
  register,
  forgotPassword,
  resetPasswordController,
} from "../controllers/auth.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

router.post("/login", loginLimiter, login);

router.post(
  "/login/verify-otp",
  verifyOtpLimiter,
  verifyLogin
);

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
  "/login/verify-otp",
  verifyLogin
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