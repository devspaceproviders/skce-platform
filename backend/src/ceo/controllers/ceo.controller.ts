import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getPublicCeo,
} from "../services/ceo.service";

export async function getPublicCeoController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ceo = await getPublicCeo();

    return res.status(200).json({
      success: true,
      data: ceo,
    });
  } catch (error) {
    next(error);
  }
}