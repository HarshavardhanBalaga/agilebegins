import { z } from "zod";

/**
 * Validation for Companion matching endpoints.
 *
 * v1 join/cancel bodies carry no meaningful fields; the schemas stay strict
 * so unknown shapes fail loudly instead of being silently ignored.
 * `queueEntryId` on cancel is accepted but ignored — the server always acts
 * on the caller's own queue entry.
 */
export const matchJoinSchema = z.strictObject({});

export const matchCancelSchema = z.object({
  queueEntryId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid queue entry id is required." })
    .optional(),
}).strict();

export const matchRoomQuerySchema = z.object({
  roomId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid room id is required." })
    .optional(),
});

export type MatchJoinInput = z.infer<typeof matchJoinSchema>;
export type MatchCancelInput = z.infer<typeof matchCancelSchema>;
export type MatchRoomQuery = z.infer<typeof matchRoomQuerySchema>;
