import type { Request, Response } from "express";

import { z } from "zod";

import { completeDevPayment } from "../services/dev-payment.service";

const devPaymentSchema = z.object({
  registrationIntentId: z
    .number()
    .int()
    .positive(
      "Registration intent ID is required"
    ),
});

export async function completeDevPaymentController(
  req: Request,
  res: Response
) {
  try {
    const validation =
      devPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid DEV payment request",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });
    }

    const result =
      await completeDevPayment(
        validation.data
          .registrationIntentId
      );

    return res.status(200).json({
      success: true,
      message:
        "DEV payment completed and registration created successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "DEV payment completion error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete DEV payment";

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

    if (
      message ===
      "An account with this email already exists"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (
      message ===
        "Unable to update registration intent"
    ) {
      return res.status(500).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete DEV payment",
    });
  }
}