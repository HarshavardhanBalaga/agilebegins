import type { ObjectId } from "mongodb";
import type { MatchQueueStatus } from "@/lib/constants";

/**
 * One document per student currently searching for a study partner.
 *
 * Queue state is persisted so refresh/disconnect can re-attach via
 * GET /api/match/status. Liveness is a sliding `expiresAt` refreshed on
 * every join/status heartbeat; a TTL index deletes dead entries.
 */
export interface MatchQueueDocument {
  _id: ObjectId;
  /** Searching student. Unique while `status` is `waiting`. */
  userId: ObjectId;
  status: MatchQueueStatus;
  /** Set while a matcher holds this entry inside a commit transaction. */
  claimedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  /** Last join/status heartbeat. */
  heartbeatAt: Date;
  /** Sliding expiry (`heartbeatAt + MATCH_QUEUE_TTL_MS`). TTL-deleted. */
  expiresAt: Date;
}
