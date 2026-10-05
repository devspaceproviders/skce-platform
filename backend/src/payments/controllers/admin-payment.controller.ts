import type { Request, Response } from "express";

import {
  listAdminPayments,
} from "../services/admin-payment.service";

export async function listAdminPaymentsController(
  req: Request,
  res: Response
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const method =
      typeof req.query.method === "string"
        ? req.query.method
        : undefined;

    const filters: {
      search?: string;
      status?: string;
      method?: string;
    } = {};

    if (search !== undefined) {
      filters.search = search;
    }

    if (status !== undefined) {
      filters.status = status;
    }

    if (method !== undefined) {
      filters.method = method;
    }

    const data = await listAdminPayments(filters);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "List admin payments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load payment records",
    });
  }
}
