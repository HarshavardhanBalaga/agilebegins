import type { ObjectId } from "mongodb";
import type { MatchInviteStatus } from "@/lib/constants";

/**
 * One pick-from-list invitation between two students.
 *
 * Invites live in their own collection so the FIFO `match_queue` invariants
 * (partial-unique waiting index, directional claim, TTL heartbeat) stay
 * untouched. A pending invite does NOT reserve either party — both remain
 * matchable by FIFO; an accept that loses the race fails cleanly instead of
 * half-committing. Terminal invites (accepted/declined) are short-lived rows
 * for idempotent retries, reclaimed by the TTL index.
 */
export interface MatchInviteDocument {
  _id: ObjectId;
  /** Student who picked (derived from session, never trusted from client). */
  fromUserId: ObjectId;
  /** Student who was picked. */
  toUserId: ObjectId;
  /**
   * Direction-agnostic pair key (`sort([from,to]).join(":")`). Unique while
   * `pending` so A→B and B→A cannot both be pending at once.
   */
  pairKey: string;
  status: MatchInviteStatus;
  /** Set on accept so retries can return the same room. */
  roomId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  /** Short expiry (`createdAt + MATCH_INVITE_TTL_MS`). TTL-deleted. */
  expiresAt: Date;
}

/** Sorts two user ids deterministically so the pair key is direction-free. */
export function invitePairKey(a: ObjectId, b: ObjectId): string {
  const [x, y] = a.toHexString() <= b.toHexString() ? [a, b] : [b, a];
  return `${x.toHexString()}:${y.toHexString()}`;
}
