import type { ObjectId } from "mongodb";
import type { StudyRoomStatus } from "@/lib/constants";

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
  /** Same as createdAt in v1; future chat/task writes advance it. */
  lastActivityAt: Date;
}

/** Sorts two member ids deterministically so `[A,B]` equals `[B,A]`. */
export function sortMemberIds(a: ObjectId, b: ObjectId): [ObjectId, ObjectId] {
  return a.toHexString() <= b.toHexString() ? [a, b] : [b, a];
}
