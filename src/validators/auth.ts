import { z } from "zod";

/**
 * Zod schemas for the authentication endpoints.
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters." })
      .max(80, { error: "Name is too long." }),
    email: z
      .string()
      .trim()
      .email({ error: "A valid email address is required." })
      .toLowerCase(),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .max(128, { error: "Password is too long." }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ error: "A valid email address is required." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ error: "A valid email address is required." }),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ error: "A valid email address is required." }),
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, { error: "Enter the 4-digit code from the email." }),
  newPassword: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(128, { error: "Password is too long." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;