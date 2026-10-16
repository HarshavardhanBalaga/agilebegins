import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { RoomTaskDocument } from "@/models/roomTask";

/**
 * Data access for the `room_tasks` collection. No business rules live here —
 * only persistence and list lookups.
 */
export const roomTaskRepository = {
  /** Inserts one shared task. */
  async insert(doc: RoomTaskDocument): Promise<void> {
    const db = await connectDB();
    await db.collection<RoomTaskDocument>(COLLECTIONS.ROOM_TASKS).insertOne(doc);
  },

  /** Whole shared list, oldest-first. */
  async listByRoom(roomId: ObjectId): Promise<RoomTaskDocument[]> {
    const db = await connectDB();
    return db
      .collection<RoomTaskDocument>(COLLECTIONS.ROOM_TASKS)
      .find({ roomId })
      .sort({ createdAt: 1 })
      .toArray();
  },

  /** Live (non-completed) task count, for the 20-task MVP cap. */
  async countOpenByRoom(roomId: ObjectId): Promise<number> {
    const db = await connectDB();
    return db
      .collection<RoomTaskDocument>(COLLECTIONS.ROOM_TASKS)
      .countDocuments({ roomId, completed: false });
  },

  /** Total count (cap guard counts open tasks only; this is for summaries). */
  async countByRoom(roomId: ObjectId): Promise<number> {
    const db = await connectDB();
    return db
      .collection<RoomTaskDocument>(COLLECTIONS.ROOM_TASKS)
      .countDocuments({ roomId });
  },

  /** Completed count (completion summary). */
  async countCompletedByRoom(roomId: ObjectId): Promise<number> {
    const db = await connectDB();
    return db
      .collection<RoomTaskDocument>(COLLECTIONS.ROOM_TASKS)
      .countDocuments({ roomId, completed: true });
  },

  /** Atomically toggles completion; returns the updated doc or null. */
  async setCompleted(
    taskId: ObjectId,
    roomId: ObjectId,
    completed: boolean,
    by: ObjectId,
    now = new Date()
  ): Promise<RoomTaskDocument | null> {
    const db = await connectDB();
    return db.collection<RoomTaskDocument>(COLLECTIONS.ROOM_TASKS).findOneAndUpdate(
      { _id: taskId, roomId },
      {
        $set: {
          completed,
          completedBy: completed ? by : undefined,
          completedAt: completed ? now : undefined,
          updatedAt: now,
        },
        ...(completed ? {} : { $unset: { completedBy: "", completedAt: "" } }),
      },
      { returnDocument: "after" }
    );
  },
};
