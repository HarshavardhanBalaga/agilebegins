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

/**
 * Validation for POST /api/match/leave.
 *
 * `roomId` is accepted but only as a consistency check — the server always
 * acts on the caller's own active room. A supplied id that is not the
 * caller's active room yields 404 (never 403, no existence oracle).
 */
export const matchLeaveSchema = z.object({
  roomId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid room id is required." })
    .optional(),
}).strict();

export type MatchJoinInput = z.infer<typeof matchJoinSchema>;
export type MatchCancelInput = z.infer<typeof matchCancelSchema>;
export type MatchRoomQuery = z.infer<typeof matchRoomQuerySchema>;
export type MatchLeaveInput = z.infer<typeof matchLeaveSchema>;

/**
 * Validation for pick-from-list endpoints.
 *
 * `toUserId` is the picked student; the sender always comes from the session.
 * `limit` caps directory rows (server clamps to MATCH_AVAILABLE_LIMIT).
 */
export const matchInviteSchema = z.object({
  toUserId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid student id is required." }),
}).strict();

export const matchInviteRespondSchema = z.object({
  action: z.enum(["accept", "decline"], {
    error: "Action must be accept or decline.",
  }),
}).strict();

export const matchAvailableQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export type MatchInviteInput = z.infer<typeof matchInviteSchema>;
export type MatchInviteRespondInput = z.infer<typeof matchInviteRespondSchema>;
export type MatchAvailableQuery = z.infer<typeof matchAvailableQuerySchema>;
