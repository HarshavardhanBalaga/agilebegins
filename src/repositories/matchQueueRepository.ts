import { ObjectId, type ClientSession } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import {
  COLLECTIONS,
  MATCH_QUEUE_STATUS,
  MATCH_QUEUE_TTL_MS,
} from "@/lib/constants";
import type { MatchQueueDocument } from "@/models/matchQueue";

/**
 * Data access for the `match_queue` collection. No business rules live here —
 * only atomic queue primitives. Business logic lives in `matchService`.
 */
export const matchQueueRepository = {
  /** Caller's live waiting entry, if any. Expired entries are invisible. */
  async findWaitingByUser(
    userId: ObjectId,
    now = new Date()
  ): Promise<MatchQueueDocument | null> {
    const db = await connectDB();
    return db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE).findOne({
      userId,
      status: MATCH_QUEUE_STATUS.WAITING,
      expiresAt: { $gt: now },
    });
  },

  /** Caller's live queue entry in any matchable state (waiting or claimed).
   * Claimed entries are invisible to `findWaitingByUser` by design (they are
   * locked by a commit), but the owner must still see them as "searching" —
   * otherwise status flaps to idle and a re-join inserts a duplicate entry.
   */
  async findLiveByUser(
    userId: ObjectId,
    now = new Date()
  ): Promise<MatchQueueDocument | null> {
    const db = await connectDB();
    return db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE).findOne({
      userId,
      status: { $in: [MATCH_QUEUE_STATUS.WAITING, MATCH_QUEUE_STATUS.CLAIMED] },
      expiresAt: { $gt: now },
    });
  },

  /** Inserts a fresh waiting entry and returns it. Caller handles dup keys. */
  async insertWaiting(
    userId: ObjectId,
    now = new Date()
  ): Promise<MatchQueueDocument> {
    const db = await connectDB();
    const doc: MatchQueueDocument = {
      _id: new ObjectId(),
      userId,
      status: MATCH_QUEUE_STATUS.WAITING,
      createdAt: now,
      updatedAt: now,
      heartbeatAt: now,
      expiresAt: new Date(now.getTime() + MATCH_QUEUE_TTL_MS),
    };
    await db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE).insertOne(doc);
    return doc;
  },

  /** Sliding heartbeat: keeps the entry alive while the client polls. */
  async touch(
    id: ObjectId,
    now = new Date()
  ): Promise<MatchQueueDocument | null> {
    const db = await connectDB();
    return db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .findOneAndUpdate(
        {
          _id: id,
          status: MATCH_QUEUE_STATUS.WAITING,
          expiresAt: { $gt: now },
        },
        {
          $set: {
            heartbeatAt: now,
            updatedAt: now,
            expiresAt: new Date(now.getTime() + MATCH_QUEUE_TTL_MS),
          },
        },
        { returnDocument: "after" }
      );
  },

  /**
   * Atomically claims the oldest live waiter that is not the caller.
   * Only one matcher wins per entry — the loser's filter no longer matches.
   * Directional FIFO: a matcher may only claim entries strictly older than
   * its own (createdAt, _id). Without this, N concurrent joiners can claim
   * each other in a cycle (A claims B while B claims A) and every commit
   * aborts — with 3 users that leaves all three searching forever.
   */
  async claimOldestPeer(
    excludeUserId: ObjectId,
    claimedBy: ObjectId,
    now = new Date(),
    olderThan?: { createdAt: Date; _id: ObjectId }
  ): Promise<MatchQueueDocument | null> {
    const db = await connectDB();
    return db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .findOneAndUpdate(
        {
          userId: { $ne: excludeUserId },
          status: MATCH_QUEUE_STATUS.WAITING,
          expiresAt: { $gt: now },
          ...(olderThan
            ? {
                $or: [
                  { createdAt: { $lt: olderThan.createdAt } },
                  {
                    createdAt: olderThan.createdAt,
                    _id: { $lt: olderThan._id },
                  },
                ],
              }
            : {}),
        },
        {
          $set: {
            status: MATCH_QUEUE_STATUS.CLAIMED,
            claimedBy,
            updatedAt: now,
          },
        },
        { sort: { createdAt: 1 }, returnDocument: "after" }
      );
  },

  /** Releases a claim so the entry becomes matchable again (abort path). */
  async releaseClaim(
    id: ObjectId,
    claimedBy: ObjectId,
    now = new Date()
  ): Promise<void> {
    const db = await connectDB();
    await db.collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE).updateOne(
      { _id: id, status: MATCH_QUEUE_STATUS.CLAIMED, claimedBy },
      { $set: { status: MATCH_QUEUE_STATUS.WAITING, updatedAt: now }, $unset: { claimedBy: "" } }
    );
  },

  /** Deletes a queue entry inside an optional transaction session. */
  async deleteById(
    id: ObjectId,
    session?: ClientSession
  ): Promise<void> {
    const db = await connectDB();
    await db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .deleteOne({ _id: id }, session ? { session } : {});
  },

  /** Finds an entry by id inside an optional transaction session. */
  async findById(
    id: ObjectId,
    session?: ClientSession
  ): Promise<MatchQueueDocument | null> {
    const db = await connectDB();
    return db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .findOne({ _id: id }, session ? { session } : {});
  },

  /** Idempotent cancel: deletes the caller's waiting entry, if any. Also
   * removes a stale `claimed` leftover owned by the caller (a commit that
   * aborted without releasing must never pin the user).
   */
  async cancelWaiting(userId: ObjectId): Promise<boolean> {
    const db = await connectDB();
    const result = await db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .deleteMany({
        userId,
        status: { $in: [MATCH_QUEUE_STATUS.WAITING, MATCH_QUEUE_STATUS.CLAIMED] },
      });
    return result.deletedCount >= 1;
  },

  /**
   * Queue position: 1 + number of live waiters created earlier.
   * Indexed count only (`status + createdAt`), never a collection scan.
   */
  async positionOf(entry: MatchQueueDocument, now = new Date()): Promise<number> {
    const db = await connectDB();
    const ahead = await db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .countDocuments({
        status: MATCH_QUEUE_STATUS.WAITING,
        expiresAt: { $gt: now },
        createdAt: { $lt: entry.createdAt },
      });
    return ahead + 1;
  },

  /** Removes one caller's stale/claimed leftovers (best-effort hygiene). */
  async deleteAllForUser(userId: ObjectId): Promise<void> {
    const db = await connectDB();
    await db
      .collection<MatchQueueDocument>(COLLECTIONS.MATCH_QUEUE)
      .deleteMany({ userId });
  },
};