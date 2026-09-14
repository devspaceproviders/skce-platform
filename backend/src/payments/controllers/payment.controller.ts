import type { Request, Response } from "express";

import { createPaymentOrderSchema } from "../validators/payment.validator";
import { createPaymentOrder } from "../services/payment.service";

export async function createOrder(
  req: Request,
  res: Response
) {
  try {
    const validationResult =
      createPaymentOrderSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment request",
        errors:
          validationResult.error.flatten()
            .fieldErrors,
      });
    }

    const {
      registrationIntentId,
    } = validationResult.data;

    const result =
      await createPaymentOrder(
        registrationIntentId
      );

    return res.status(201).json({
      success: true,
      message:
        "Payment order created successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Payment order creation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create payment order";

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
      "This registration has already been completed"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message === "Package not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create payment order",
    });
  }
}