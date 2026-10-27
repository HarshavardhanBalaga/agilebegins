import { z } from "zod";
import {
  ROOM_GOAL_MAX_LENGTH,
  ROOM_MESSAGE_MAX_LENGTH,
  ROOM_PRESENCE,
  ROOM_REPORT_MAX_LENGTH,
  ROOM_TASK_MAX_LENGTH,
  ROOM_TIMER_MAX_SECONDS,
  ROOM_TIMER_MIN_SECONDS,
} from "@/lib/constants";

/**
 * Validation for Companion room-state endpoints (polling-only MVP).
 *
 * Bodies stay small and strict — unknown shapes fail loudly. Length caps
 * mirror the UI hints; HTML stripping happens in the service layer so the
 * stored text is always plain.
 */

const roomIdField = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid room id is required." });

const taskIdField = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, { error: "A valid task id is required." });

export const roomGoalSchema = z
  .object({
    goal: z
      .string()
      .trim()
      .max(ROOM_GOAL_MAX_LENGTH, {
        error: `Goal must be ${ROOM_GOAL_MAX_LENGTH} characters or fewer.`,
      }),
  })
  .strict();

export const roomPresenceSchema = z
  .object({
    presence: z.enum(ROOM_PRESENCE, {
      error: "Presence must be studying, break, or away.",
    }),
  })
  .strict();

const timerSeconds = z.coerce
  .number()
  .int()
  .min(ROOM_TIMER_MIN_SECONDS, {
    error: `Timer length must be at least ${ROOM_TIMER_MIN_SECONDS} seconds.`,
  })
  .max(ROOM_TIMER_MAX_SECONDS, {
    error: `Timer length must be ${ROOM_TIMER_MAX_SECONDS} seconds or fewer.`,
  });

export const roomTimerSchema = z
  .object({
    action: z.enum(["start", "pause", "resume", "finish", "set"], {
      error: "Action must be start, pause, resume, finish, or set.",
    }),
    /** Phase to start (`start` only; defaults to focus). */
    phase: z.enum(["focus", "break"]).optional(),
    /** Custom length in seconds (`start`, or the shared idle length with `set`). */
    durationSec: timerSeconds.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.action !== "start" ||
      value.phase === undefined ||
      value.phase === "focus" ||
      value.phase === "break",
    { error: "Phase must be focus or break.", path: ["phase"] }
  )
  .refine((value) => value.action !== "set" || value.durationSec !== undefined, {
    error: "Timer length is required.",
    path: ["durationSec"],
  });

export const roomTaskCreateSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, { error: "Task text is required." })
      .max(ROOM_TASK_MAX_LENGTH, {
        error: `Task must be ${ROOM_TASK_MAX_LENGTH} characters or fewer.`,
      }),
  })
  .strict();

export const roomTaskToggleSchema = z
  .object({
    taskId: taskIdField,
    completed: z.boolean({ error: "Completed must be true or false." }),
  })
  .strict();

export const roomMessageSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, { error: "Message text is required." })
      .max(ROOM_MESSAGE_MAX_LENGTH, {
        error: `Message must be ${ROOM_MESSAGE_MAX_LENGTH} characters or fewer.`,
      }),
  })
  .strict();

export const roomReportSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .max(ROOM_REPORT_MAX_LENGTH, {
        error: `Reason must be ${ROOM_REPORT_MAX_LENGTH} characters or fewer.`,
      })
      .optional()
      .default(""),
  })
  .strict();

export const roomBlockSchema = z.strictObject({});

export type RoomGoalInput = z.infer<typeof roomGoalSchema>;
export type RoomPresenceInput = z.infer<typeof roomPresenceSchema>;
export type RoomTimerInput = z.infer<typeof roomTimerSchema>;
export type RoomTaskCreateInput = z.infer<typeof roomTaskCreateSchema>;
export type RoomTaskToggleInput = z.infer<typeof roomTaskToggleSchema>;
export type RoomMessageInput = z.infer<typeof roomMessageSchema>;
export type RoomReportInput = z.infer<typeof roomReportSchema>;
export type RoomBlockInput = z.infer<typeof roomBlockSchema>;

export { roomIdField };
