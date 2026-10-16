import type { ObjectId } from "mongodb";
import type {
  RoomPresence,
  RoomTimerPhase,
  RoomTimerState,
  StudyRoomStatus,
} from "@/lib/constants";

/**
 * Per-member room state: what they are working on, how present they look,
 * and when they last polled (heartbeat → online/offline).
 */
export interface RoomMemberState {
  userId: ObjectId;
  /** Free-text session goal ("Finish React auth"). Empty = not set yet. */
  goal: string;
  goalUpdatedAt?: Date;
  presence: RoomPresence;
  presenceUpdatedAt?: Date;
  lastSeenAt: Date;
}

/**
 * Shared timer. Server-authoritative: `endsAt` is the wall-clock moment the
 * phase completes, so both clients render the same countdown. `remainingSec`
 * is the source of truth while paused/stopped.
 */
export interface RoomTimer {
  phase: RoomTimerPhase;
  state: RoomTimerState;
  /** Length of the current phase in seconds. */
  durationSec: number;
  /** Seconds left when paused/stopped. Ignored while running. */
  remainingSec: number;
  /** Wall-clock end of the running phase. Set while running only. */
  endsAt?: Date;
  /** Who last changed the timer (for "Rahul started focus" hints). */
  updatedBy?: ObjectId;
  updatedAt: Date;
}

/**
 * Written once when the room closes: powers the lightweight
 * "Session complete — 45 min focused, 3 tasks" screen.
 */
export interface RoomSummary {
  /** Whole minutes between room creation and close. */
  durationMin: number;
  /** Focus seconds banked across all focus phases (capped at elapsed). */
  focusSec: number;
  tasksCompleted: number;
  messagesExchanged: number;
  closedBy?: ObjectId;
  closedAt: Date;
}

/**
 * One document per matched study-partner pair.
 *
 * Room state is persisted so both partners can refresh/rejoin via
 * GET /api/match/room. Active rooms are never TTL-deleted in v1;
 * `closed` is reserved for the future leave/close flow.
 */
export interface StudyRoomDocument {
  _id: ObjectId;
  /** Exactly two distinct members, sorted by hex string for determinism. */
  memberIds: ObjectId[];
  status: StudyRoomStatus;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  /** Which member closed the room (set on close only; v2 close always means "leave"). */
  closedBy?: ObjectId;
  /** Same as createdAt in v1; future chat/task writes advance it. */
  lastActivityAt: Date;
  /** Per-member presence/goal state, keyed by member hex id. */
  members?: Record<string, RoomMemberState>;
  /** Shared focus timer. Absent = never started (treated as idle). */
  timer?: RoomTimer;
  /** Completion stats, written on close. */
  summary?: RoomSummary;
}

/** Sorts two member ids deterministically so `[A,B]` equals `[B,A]`. */
export function sortMemberIds(a: ObjectId, b: ObjectId): [ObjectId, ObjectId] {
  return a.toHexString() <= b.toHexString() ? [a, b] : [b, a];
}

