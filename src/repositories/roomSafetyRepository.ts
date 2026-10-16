import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { RoomReportDocument } from "@/models/roomReport";
import type { RoomBlockDocument } from "@/models/roomBlock";

/**
 * Data access for `room_reports` + `room_blocks`. Writes are idempotent
 * where it matters (blocks upsert on the unique pair).
 */
export const roomSafetyRepository = {
  /** Files a safety report. */
  async insertReport(doc: RoomReportDocument): Promise<void> {
    const db = await connectDB();
    await db.collection<RoomReportDocument>(COLLECTIONS.ROOM_REPORTS).insertOne(doc);
  },

  /** One-way block; repeat blocks are no-ops. */
  async upsertBlock(doc: RoomBlockDocument): Promise<void> {
    const db = await connectDB();
    await db.collection<RoomBlockDocument>(COLLECTIONS.ROOM_BLOCKS).updateOne(
      { blockerId: doc.blockerId, blockedId: doc.blockedId },
      { $setOnInsert: doc },
      { upsert: true }
    );
  },

  /** True when either user blocked the other (either direction). */
  async blockedBetween(a: ObjectId, b: ObjectId): Promise<boolean> {
    const db = await connectDB();
    const hit = await db.collection<RoomBlockDocument>(COLLECTIONS.ROOM_BLOCKS).findOne({
      $or: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    });
    return hit !== null;
  },
};
