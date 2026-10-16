import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS, ROOM_MESSAGES_LIMIT } from "@/lib/constants";
import type { RoomMessageDocument } from "@/models/roomMessage";

/**
 * Data access for the `room_messages` collection. No business rules live
 * here — only persistence and history lookups.
 */
export const roomMessageRepository = {
  /** Inserts one chat message. */
  async insert(doc: RoomMessageDocument): Promise<void> {
    const db = await connectDB();
    await db.collection<RoomMessageDocument>(COLLECTIONS.ROOM_MESSAGES).insertOne(doc);
  },

  /** Latest messages, oldest-first, capped for the MVP chat pane. */
  async listLatest(roomId: ObjectId, limit = ROOM_MESSAGES_LIMIT): Promise<RoomMessageDocument[]> {
    const db = await connectDB();
    const rows = await db
      .collection<RoomMessageDocument>(COLLECTIONS.ROOM_MESSAGES)
      .find({ roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return rows.reverse();
  },

  /** Total messages in a room (completion summary). */
  async countByRoom(roomId: ObjectId): Promise<number> {
    const db = await connectDB();
    return db
      .collection<RoomMessageDocument>(COLLECTIONS.ROOM_MESSAGES)
      .countDocuments({ roomId });
  },
};
