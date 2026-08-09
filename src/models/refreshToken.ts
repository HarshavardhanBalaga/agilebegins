import type { ObjectId } from "mongodb";

/**
 * A refresh token record exactly as stored in the `refreshTokens` collection.
 *
 * The raw JWT is never stored — only its SHA-256 hash. `revokedAt` supports
 * rotation: when a token is refreshed or revoked, the old row gets a
 * `revokedAt` timestamp so it can never be replayed.
 */
export interface RefreshTokenDocument {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/** Shape passed to insertOne when issuing a new refresh token. */
export type NewRefreshToken = Omit<RefreshTokenDocument, "_id" | "createdAt">;