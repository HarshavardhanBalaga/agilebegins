import { z } from "zod";

/**
 * Zod schemas for workshop admin actions.
 */

/** An optional URL that may also be an empty string (clears the override). */
const optionalUrl = z
  .union([
    z
      .string()
      .trim()
      .url({ error: "Must be a valid URL." })
      .max(500, { error: "URL is too long." }),
    z.literal(""),
  ])
  .optional();

/**
 * Per-workshop email settings. `sendTest` renders a preview email to the
 * admin's address without saving; otherwise the fields are persisted (empty
 * strings clear the override so env fallbacks apply).
 */
export const workshopMailSettingsSchema = z.object({
  workshopId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, {
      error: "A valid workshop id is required.",
    }),
  meetingLink: optionalUrl,
  whatsappLink: optionalUrl,
  emailSubject: z
    .string()
    .trim()
    .max(120, { error: "Subject is too long." })
    .optional(),
  emailBody: z
    .string()
    .trim()
    .max(2000, { error: "Email body is too long." })
    .optional(),
  sendTest: z.boolean().optional(),
});

export type WorkshopMailSettingsInput = z.infer<
  typeof workshopMailSettingsSchema
>;
