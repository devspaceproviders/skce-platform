import { z } from "zod";

/* ==========================================================
   REGISTER
========================================================== */

export const registerSchema = z.object({
  // ----------------------------------------------------------
  // ACCOUNT DETAILS
  // ----------------------------------------------------------

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
    .min(
      10,
      "Phone number must be at least 10 characters"
    )
    .max(
      15,
      "Phone number is too long"
    ),

  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters"
    ),

  // ----------------------------------------------------------
  // STUDENT DETAILS
  // ----------------------------------------------------------

  dateOfBirth: z
    .string()
    .trim()
    .min(
      1,
      "Date of birth is required"
    ),

  gender: z
    .string()
    .trim()
    .min(
      1,
      "Gender is required"
    ),

  qualification: z
    .string()
    .trim()
    .min(
      1,
      "Class / Qualification is required"
    ),

  organization: z
    .string()
    .trim()
    .min(
      1,
      "School / College / Organization is required"
    ),

  // ----------------------------------------------------------
  // PARENT / GUARDIAN
  // ----------------------------------------------------------

  guardianName: z
    .string()
    .trim()
    .min(
      2,
      "Parent / Guardian name is required"
    ),

  guardianRelationship: z
    .string()
    .trim()
    .min(
      1,
      "Relationship is required"
    ),

  guardianMobile: z
    .string()
    .trim()
    .min(
      10,
      "Guardian mobile number must be at least 10 characters"
    )
    .max(
      15,
      "Guardian mobile number is too long"
    ),

  guardianWhatsapp: z
    .string()
    .trim()
    .max(
      15,
      "WhatsApp number is too long"
    )
    .optional()
    .or(z.literal("")),

  guardianEmail: z
    .string()
    .trim()
    .email(
      "Please enter a valid guardian email address"
    )
    .optional()
    .or(z.literal("")),

  // ----------------------------------------------------------
  // PACKAGE / COURSE
  // ----------------------------------------------------------

  packageSlug: z
    .string()
    .trim()
    .min(
      1,
      "Package is required"
    ),

  courseSlug: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  // ----------------------------------------------------------
  // ONLINE LEARNING
  // ----------------------------------------------------------

  deviceTypes: z
    .string()
    .trim()
    .min(
      1,
      "Please select at least one device"
    ),

  internetFacility: z
    .string()
    .trim()
    .min(
      1,
      "Please select your internet facility"
    ),

  preferredClassApp: z
    .string()
    .trim()
    .min(
      1,
      "Please select your preferred class app"
    ),

  // ----------------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------------

  address: z
    .string()
    .trim()
    .min(
      5,
      "Address is required"
    ),

  city: z
    .string()
    .trim()
    .min(
      2,
      "City is required"
    ),

  pin: z
    .string()
    .trim()
    .min(
      4,
      "PIN is required"
    )
    .max(
      10,
      "PIN is too long"
    ),

  state: z
    .string()
    .trim()
    .min(
      1,
      "Please select your state"
    ),

  // ----------------------------------------------------------
  // REFERRAL
  // ----------------------------------------------------------

  referralSource: z
    .string()
    .trim()
    .min(
      1,
      "Please select how you heard about SKCE"
    ),

  referralName: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  referralMobile: z
    .string()
    .trim()
    .max(
      15,
      "Referral mobile number is too long"
    )
    .optional()
    .or(z.literal("")),

  referralId: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  // ----------------------------------------------------------
  // DECLARATION
  // ----------------------------------------------------------

  declarationAccepted: z
    .boolean()
    .refine(
      (value) => value === true,
      "You must accept the declaration"
    ),
});

export type RegisterInput =
  z.infer<typeof registerSchema>;

/* ==========================================================
   LOGIN
========================================================== */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email(
      "Please enter a valid email address"
    )
    .toLowerCase(),

  password: z
    .string()
    .min(
      1,
      "Password is required"
    ),
});

export type LoginInput =
  z.infer<typeof loginSchema>;

/* ==========================================================
   FORGOT PASSWORD
========================================================== */

export const forgotPasswordSchema =
  z.object({
    email: z
      .string()
      .trim()
      .email(
        "Please enter a valid email address"
      )
      .toLowerCase(),
  });

export type ForgotPasswordInput =
  z.infer<
    typeof forgotPasswordSchema
  >;

/* ==========================================================
   RESET PASSWORD
========================================================== */

export const resetPasswordSchema =
  z.object({
    token: z
      .string()
      .trim()
      .min(
        1,
        "Reset token is required"
      ),

    password: z
      .string()
      .min(
        8,
        "Password must contain at least 8 characters"
      ),

    confirmPassword: z
      .string()
      .min(
        8,
        "Please confirm your password"
      ),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message:
        "Passwords do not match",
      path: [
        "confirmPassword",
      ],
    }
  );

export type ResetPasswordInput =
  z.infer<
    typeof resetPasswordSchema
  >;