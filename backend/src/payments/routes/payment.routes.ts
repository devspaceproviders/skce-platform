import { Router } from "express";

import {
  createRegistrationIntentController,
} from "../controllers/registration-intent.controller";

import {
  createOrder,
} from "../controllers/payment.controller";

import {
  verifyPayment,
} from "../controllers/payment-verification.controller";

import {
  completeDevPaymentController,
} from "../controllers/dev-payment.controller";

const router = Router();

/*
 * ==========================================================
 * REGISTRATION INTENT
 * ==========================================================
 */

router.post(
  "/registration-intent",
  createRegistrationIntentController
);

/*
 * ==========================================================
 * RAZORPAY
 * ==========================================================
 *
 * Real payment flow:
 *
 * create-order
 *      ↓
 * Razorpay Checkout
 *      ↓
 * verify
 *      ↓
 * Backend signature verification
 */

router.post(
  "/create-order",
  createOrder
);

router.post(
  "/verify",
  verifyPayment
);

/*
 * ==========================================================
 * DEV PAYMENT
 * ==========================================================
 *
 * This endpoint exists only for local development/testing.
 *
 * IMPORTANT:
 * It is intentionally NOT registered when NODE_ENV
 * is "production".
 *
 * Therefore a production server cannot bypass
 * Razorpay verification through this endpoint.
 */

if (process.env.NODE_ENV !== "production") {
  router.post(
    "/dev-complete",
    completeDevPaymentController
  );
}

export default router;