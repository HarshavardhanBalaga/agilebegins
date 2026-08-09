import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { RefreshTokenDocument, NewRefreshToken } from "@/models/refreshToken";

/**
 * Data access for the `refreshTokens` collection. Tokens are stored as
 * SHA-256 hashes only; the raw token never touches the database.
 */
export const refreshTokenRepository = {
  async create(token: NewRefreshToken): Promise<void> {
    const db = await connectDB();
    await db
      .collection<RefreshTokenDocument>(COLLECTIONS.REFRESH_TOKENS)
      .insertOne({ _id: new ObjectId(), ...token, createdAt: new Date() });
  },

  async findByHash(tokenHash: string): Promise<RefreshTokenDocument | null> {
    const db = await connectDB();
    return db
      .collection<RefreshTokenDocument>(COLLECTIONS.REFRESH_TOKENS)
      .findOne({ tokenHash });
  },

  /** Revokes a single token row (refresh rotation / logout). */
  async revoke(tokenHash: string): Promise<void> {
    const db = await connectDB();
    await db
      .collection<RefreshTokenDocument>(COLLECTIONS.REFRESH_TOKENS)
      .updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
  },

  /** Revokes every active token for a user (defense in depth on logout). */
  async revokeAllForUser(userId: ObjectId): Promise<void> {
    const db = await connectDB();
    await db
      .collection<RefreshTokenDocument>(COLLECTIONS.REFRESH_TOKENS)
      .updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
  },
};