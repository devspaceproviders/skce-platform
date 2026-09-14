import type { Request, Response } from "express";

import { registerSchema } from "../../auth/validators/auth.validator";
import { createRegistrationIntent } from "../services/registration-intent.service";

export async function createRegistrationIntentController(
  req: Request,
  res: Response
) {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await createRegistrationIntent(
      validation.data
    );

    return res.status(201).json({
      success: true,
      message: "Registration intent created successfully",
      data: {
        registrationIntentId: result.registrationIntent.id,

        package: result.package,

        course: result.course,

        status: result.registrationIntent.status,
      },
    });
  } catch (error) {
    console.error(
      "Registration intent creation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create registration intent";

    if (
      message ===
      "An account with this email already exists"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message === "Package is required") {
      return res.status(400).json({
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

    if (message === "Course not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create registration intent",
    });
  }
}