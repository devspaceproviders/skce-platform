import type { Request, Response } from "express";

import { verifyPaymentSchema } from "../validators/payment-verification.validator";
import {
  verifyAndCompletePayment,
} from "../services/payment-verification.service";

export async function verifyPayment(
  req: Request,
  res: Response
) {
  try {
    const validationResult =
      verifyPaymentSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment verification data",
        errors:
          validationResult.error.flatten()
            .fieldErrors,
      });
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = validationResult.data;

    const result =
      await verifyAndCompletePayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

    return res.status(200).json({
      success: true,
      message: result.alreadyCompleted
        ? "Payment was already completed"
        : "Payment verified and registration completed successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify payment";

    if (message === "Payment not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Registration intent not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Invalid Razorpay payment signature"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Payment is not linked to a registration intent"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "An account with this email already exists"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify payment",
    });
  }
}