import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";

/**
 * Creates the indexes the app relies on:
 *
 * - users           : unique email (registration uniqueness)
 * - workshops       : unique slug (seed also creates it; idempotent here)
 * - registrations   : unique (userId + workshopId) prevents double booking,
 *                     unique transactionId prevents duplicate payments,
 *                     supporting indexes for the admin dashboard.
 * - refreshTokens   : unique tokenHash, TTL on expiresAt, and userId for
 *                     bulk revokes.
 * - match_queue     : unique userId while waiting (one search per student),
 *                     TTL on expiresAt (stale-entry cleanup), supporting
 *                     indexes for the oldest-waiting FIFO scan.
 * - study_rooms     : unique memberIds while active (one room per student),
 *                     supporting index for status-sorted listings, plus
 *                     { memberIds, status } for active/closed membership lookup.
 * - match_invites   : unique pairKey while pending (one live invite per pair),
 *                     sender/recipient status lookups, TTL on expiresAt.
 *
 * Safe to run repeatedly — MongoDB `createIndex` is a no-op once an index
 * with the same key/options already exists.
 */
export async function ensureIndexes(): Promise<void> {
  const db = await connectDB();

  await db.collection(COLLECTIONS.USERS).createIndex(
    { email: 1 },
    { unique: true }
  );

  await db
    .collection(COLLECTIONS.WORKSHOPS)
    .createIndex({ slug: 1 }, { unique: true });

  await db.collection(COLLECTIONS.REGISTRATIONS).createIndex(
    { userId: 1, workshopId: 1 },
    { unique: true }
  );

  await db.collection(COLLECTIONS.REGISTRATIONS).createIndex(
    { transactionId: 1 },
    { unique: true, partialFilterExpression: { transactionId: { $type: "string" } } }
  );

  await db
    .collection(COLLECTIONS.REGISTRATIONS)
    .createIndex({ paymentStatus: 1, createdAt: -1 });

  await db
    .collection(COLLECTIONS.REGISTRATIONS)
    .createIndex({ workshopId: 1, paymentStatus: 1 });

  await db
    .collection(COLLECTIONS.REFRESH_TOKENS)
    .createIndex({ tokenHash: 1 }, { unique: true });

  await db
    .collection(COLLECTIONS.REFRESH_TOKENS)
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db.collection(COLLECTIONS.REFRESH_TOKENS).createIndex({ userId: 1 });

  await db.collection(COLLECTIONS.USERS).createIndex({ emailVerified: 1 });

  await db
    .collection(COLLECTIONS.OTPS)
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db.collection(COLLECTIONS.OTPS).createIndex({ userId: 1, purpose: 1 });

  await db.collection(COLLECTIONS.MATCH_QUEUE).createIndex(
    { userId: 1 },
    {
      unique: true,
      partialFilterExpression: { status: "waiting" },
      name: "match_queue_user_waiting_unique",
    }
  );

  await db.collection(COLLECTIONS.MATCH_QUEUE).createIndex(
    { status: 1, createdAt: 1 },
    { name: "match_queue_fifo" }
  );

  await db.collection(COLLECTIONS.MATCH_QUEUE).createIndex(
    { status: 1, expiresAt: 1 },
    { name: "match_queue_liveness" }
  );

  await db.collection(COLLECTIONS.MATCH_QUEUE).createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "match_queue_expiry_ttl" }
  );

  await db.collection(COLLECTIONS.STUDY_ROOMS).createIndex(
    { memberIds: 1 },
    {
      unique: true,
      partialFilterExpression: { status: "active" },
      name: "study_rooms_member_active_unique",
    }
  );

  await db
    .collection(COLLECTIONS.STUDY_ROOMS)
    .createIndex({ status: 1, createdAt: -1 }, { name: "study_rooms_status" });

  await db.collection(COLLECTIONS.STUDY_ROOMS).createIndex(
    { memberIds: 1, status: 1 },
    { name: "study_rooms_member_status" }
  );

  await db.collection(COLLECTIONS.MATCH_INVITES).createIndex(
    { pairKey: 1 },
    {
      unique: true,
      partialFilterExpression: { status: "pending" },
      name: "match_invites_pair_pending_unique",
    }
  );

  await db.collection(COLLECTIONS.MATCH_INVITES).createIndex(
    { fromUserId: 1, status: 1 },
    { name: "match_invites_from_status" }
  );

  await db.collection(COLLECTIONS.MATCH_INVITES).createIndex(
    { toUserId: 1, status: 1 },
    { name: "match_invites_to_status" }
  );

  await db.collection(COLLECTIONS.MATCH_INVITES).createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "match_invites_expiry_ttl" }
  );
}

/** Human-readable list of what ensureIndexes guarantees. */
export const INDEX_SUMMARY = [
  "users.email — unique (one account per email)",
  "workshops.slug — unique",
  `registrations (userId + workshopId): unique (no double booking)`,
  "registrations.transactionId: unique (no duplicate payments)",
  `registrations { paymentStatus, createdAt } for dashboard sorting`,
  `registrations { workshopId, paymentStatus } for per-workshop admin views`,
  `refreshTokens.tokenHash: unique`,
  "refreshTokens.expiresAt: TTL (auto-cleans expired tokens)",
  "refreshTokens.userId: lookup index for revocation",
  "users.emailVerified: lookup index for unverified-student queries",
  "otps.expiresAt: TTL (auto-cleans expired codes)",
  "otps { userId, purpose }: lookup index for reset verification",
  "match_queue.userId — unique while waiting (one search per student)",
  "match_queue { status, createdAt }: FIFO oldest-waiting scan",
  "match_queue { status, expiresAt }: stale-entry skip",
  "match_queue.expiresAt: TTL (auto-cleans dead searches)",
  "study_rooms.memberIds — unique while active (one room per student)",
  "study_rooms { status, createdAt }: status-sorted listings",
  "study_rooms { memberIds, status }: active/closed membership lookup",
  "match_invites.pairKey — unique while pending (one live invite per pair)",
  "match_invites { fromUserId, status } / { toUserId, status }: inbox lookups",
  "match_invites.expiresAt: TTL (auto-cleans dead invites)",
];