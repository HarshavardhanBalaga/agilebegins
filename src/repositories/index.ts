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
    .collection(COLLECTIONS.REFRESH_TOKENS)
    .createIndex({ tokenHash: 1 }, { unique: true });

  await db
    .collection(COLLECTIONS.REFRESH_TOKENS)
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await db.collection(COLLECTIONS.REFRESH_TOKENS).createIndex({ userId: 1 });
}

/** Human-readable list of what ensureIndexes guarantees. */
export const INDEX_SUMMARY = [
  "users.email — unique (one account per email)",
  "workshops.slug — unique",
  `registrations (userId + workshopId): unique (no double booking)`,
  "registrations.transactionId: unique (no duplicate payments)",
  `registrations { paymentStatus, createdAt } for dashboard sorting`,
  `refreshTokens.tokenHash: unique`,
  "refreshTokens.expiresAt: TTL (auto-cleans expired tokens)",
  "refreshTokens.userId: lookup index for revocation",
];