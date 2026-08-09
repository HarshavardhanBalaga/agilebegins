import { z } from "zod";
import { MAX_TXN_ID_LENGTH } from "@/lib/constants";

/**
 * Zod schemas for workshop registrations.
 */
export const registrationInputSchema = z.object({
  workshopId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid workshop id is required." }),
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(80, { error: "Name is too long." }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ error: "A valid email address is required." }),
  phone: z
    .string()
    .trim()
    // Normalize to a plain number (drop spaces/hyphens, keep optional +91) so
    // "+91 98765 43210" and "9876543210" both pass and store cleanly.
    .transform((value) => value.replace(/[\s-]/g, ""))
    .refine((value) => /^(\+91)?[6-9]\d{9}$/.test(value), {
      error: "Enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).",
    }),
  college: z
    .string()
    .trim()
    .min(2, { error: "College name is required." })
    .max(120, { error: "College name is too long." }),
  branch: z
    .string()
    .trim()
    .min(2, { error: "Branch is required." })
    .max(80, { error: "Branch is too long." }),
  year: z
    .string()
    .trim()
    .min(1, { error: "Year is required." })
    .max(20, { error: "Year is too long." }),
  transactionId: z
    .string()
    .trim()
    .min(3, { error: "A valid transaction id is required." })
    .max(MAX_TXN_ID_LENGTH, { error: "Transaction id is too long." }),
});

/**
 * Screenshot is optional. When provided it must be a smallish PNG/JPEG/WebP
 * data URL so the base64 never balloons the Mongo document.
 */
export const screenshotSchema = z
  .string()
  .trim()
  .max(2_500_000, { error: "Screenshot is too large." })
  .refine(
    (value) =>
      value.startsWith("data:image/png;base64,") ||
      value.startsWith("data:image/jpeg;base64,") ||
      value.startsWith("data:image/webp;base64,"),
    { error: "Screenshot must be a PNG, JPEG or WebP image." }
  )
  .optional()
  .nullable();

export const adminActionSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid registration id is required." }),
});

export const attendanceSchema = adminActionSchema.extend({
  attendance: z.boolean(),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;