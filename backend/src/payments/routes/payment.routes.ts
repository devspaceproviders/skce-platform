import { Router } from "express";

import { createOrder } from "../controllers/payment.controller";
import {
  verifyPayment,
} from "../controllers/payment-verification.controller";
import {
  createRegistrationIntentController,
} from "../controllers/registration-intent.controller";
import {
  completeDevPaymentController,
} from "../controllers/dev-payment.controller";

const router = Router();

router.post(
  "/registration-intent",
  createRegistrationIntentController
);

router.post(
  "/create-order",
  createOrder
);

router.post(
  "/verify",
  verifyPayment
);

/*
 * DEV ONLY
 *
 * Simulates a successful payment so the
 * complete registration flow can be tested
 * before Razorpay onboarding is available.
 */
router.post(
  "/dev-complete",
  completeDevPaymentController
);

export default router;