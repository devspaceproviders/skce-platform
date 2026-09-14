import { z } from "zod";

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z
    .string()
    .trim()
    .min(1, "Razorpay order ID is required"),

  razorpayPaymentId: z
    .string()
    .trim()
    .min(1, "Razorpay payment ID is required"),

  razorpaySignature: z
    .string()
    .trim()
    .min(1, "Razorpay signature is required"),
});

export type VerifyPaymentInput = z.infer<
  typeof verifyPaymentSchema
>;