import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import {
  COLLECTIONS,
  MATCH_INVITE_STATUS,
  MATCH_INVITE_TTL_MS,
} from "@/lib/constants";
import {
  invitePairKey,
  type MatchInviteDocument,
} from "@/models/matchInvite";

/**
 * Data access for the `match_invites` collection. No business rules live here —
 * only invite persistence and pending-state lookups. Eligibility, pairing, and
 * the transactional accept commit live in `inviteService`.
 */
export const matchInviteRepository = {
  /** Inserts a pending invite. Caller handles duplicate-key (pair already pending). */
  async createPending(
    fromUserId: ObjectId,
    toUserId: ObjectId,
    now = new Date()
  ): Promise<MatchInviteDocument> {
    const db = await connectDB();
    const doc: MatchInviteDocument = {
      _id: new ObjectId(),
      fromUserId,
      toUserId,
      pairKey: invitePairKey(fromUserId, toUserId),
      status: MATCH_INVITE_STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + MATCH_INVITE_TTL_MS),
    };
    await db.collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES).insertOne(doc);
    return doc;
  },

  /** Live pending invite by id (expired invites are invisible). */
  async findPendingById(
    id: ObjectId,
    now = new Date()
  ): Promise<MatchInviteDocument | null> {
    const db = await connectDB();
    return db.collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES).findOne({
      _id: id,
      status: MATCH_INVITE_STATUS.PENDING,
      expiresAt: { $gt: now },
    });
  },

  /** Any invite by id, regardless of status (for idempotent retries). */
  async findById(id: ObjectId): Promise<MatchInviteDocument | null> {
    const db = await connectDB();
    return db
      .collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES)
      .findOne({ _id: id });
  },

  /** Live pending invite between two users in either direction. */
  async findPendingBetween(
    a: ObjectId,
    b: ObjectId,
    now = new Date()
  ): Promise<MatchInviteDocument | null> {
    const db = await connectDB();
    return db.collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES).findOne({
      pairKey: invitePairKey(a, b),
      status: MATCH_INVITE_STATUS.PENDING,
      expiresAt: { $gt: now },
    });
  },

  /** All live pending invites involving a user (incoming + outgoing). */
  async listPendingForUser(
    userId: ObjectId,
    now = new Date()
  ): Promise<MatchInviteDocument[]> {
    const db = await connectDB();
    return db
      .collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES)
      .find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: MATCH_INVITE_STATUS.PENDING,
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .toArray();
  },

  /** Marks a pending invite declined. Returns the updated doc, if still pending. */
  async markDeclined(
    id: ObjectId,
    now = new Date()
  ): Promise<MatchInviteDocument | null> {
    const db = await connectDB();
    return db
      .collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES)
      .findOneAndUpdate(
        {
          _id: id,
          status: MATCH_INVITE_STATUS.PENDING,
          expiresAt: { $gt: now },
        },
        { $set: { status: MATCH_INVITE_STATUS.DECLINED, updatedAt: now } },
        { returnDocument: "after" }
      );
  },

  /**
   * Idempotent sender-cancel: deletes the sender's pending invite.
   * Returns true when a pending invite was removed.
   */
  async deletePendingBySender(id: ObjectId, fromUserId: ObjectId): Promise<boolean> {
    const db = await connectDB();
    const result = await db
      .collection<MatchInviteDocument>(COLLECTIONS.MATCH_INVITES)
      .deleteOne({ _id: id, fromUserId, status: MATCH_INVITE_STATUS.PENDING });
    return result.deletedCount === 1;
  },
};
