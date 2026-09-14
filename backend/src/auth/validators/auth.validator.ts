import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 characters")
    .max(15, "Phone number is too long"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  state: z
    .string()
    .trim()
    .optional(),

  referralId: z
    .string()
    .trim()
    .optional(),

  packageSlug: z
    .string()
    .trim()
    .optional(),

  courseSlug: z
    .string()
    .trim()
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;