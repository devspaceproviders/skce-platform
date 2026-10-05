import { Router } from "express";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import {
  listAdminPaymentsController,
} from "../controllers/admin-payment.controller";

const router = Router();

/*
 * ============================================================
 * ADMIN PAYMENTS
 * ============================================================
 *
 * All routes in this router are ADMIN only.
 *
 * GET /api/admin/payments
 *
 * Optional query parameters:
 *
 * ?search=
 * ?status=
 * ?method=
 *
 * ============================================================
 */

router.use(
  authenticate,
  requireRole("ADMIN")
);

router.get(
  "/",
  listAdminPaymentsController
);

export default router;
