import { z } from "zod";

export const createPaymentOrderSchema =
  z.object({
    registrationIntentId: z
      .number()
      .int()
      .positive(
        "Registration intent ID is required"
      ),
  });

export type CreatePaymentOrderInput =
  z.infer<
    typeof createPaymentOrderSchema
  >;