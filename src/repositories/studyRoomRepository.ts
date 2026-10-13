import { ObjectId, type ClientSession } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS, STUDY_ROOM_STATUS } from "@/lib/constants";
import type { StudyRoomDocument } from "@/models/studyRoom";

/**
 * Data access for the `study_rooms` collection. No business rules live here —
 * only room persistence and membership lookups.
 */
export const studyRoomRepository = {
  /** Caller's active room, if any. */
  async findActiveByMember(
    userId: ObjectId
  ): Promise<StudyRoomDocument | null> {
    const db = await connectDB();
    return db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).findOne({
      memberIds: userId,
      status: STUDY_ROOM_STATUS.ACTIVE,
    });
  },

  /** Active room by id that contains the caller (404-safe lookup). */
  async findActiveByIdForMember(
    roomId: ObjectId,
    userId: ObjectId
  ): Promise<StudyRoomDocument | null> {
    const db = await connectDB();
    return db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).findOne({
      _id: roomId,
      memberIds: userId,
      status: STUDY_ROOM_STATUS.ACTIVE,
    });
  },

  /**
   * Atomically closes the caller's active room (bilateral: closed for both
   * members). Single-doc atomic — concurrent double-leave resolves to one
   * closed doc; retries are idempotent (no active room → null).
   */
  async closeActiveByMember(
    userId: ObjectId,
    now = new Date()
  ): Promise<StudyRoomDocument | null> {
    const db = await connectDB();
    return db
      .collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS)
      .findOneAndUpdate(
        { memberIds: userId, status: STUDY_ROOM_STATUS.ACTIVE },
        {
          $set: {
            status: STUDY_ROOM_STATUS.CLOSED,
            closedAt: now,
            closedBy: userId,
            updatedAt: now,
            lastActivityAt: now,
          },
        },
        { returnDocument: "after" }
      );
  },

  /** Closed room by id that contains the caller (partner-left visibility). */
  async findClosedByIdForMember(
    roomId: ObjectId,
    userId: ObjectId
  ): Promise<StudyRoomDocument | null> {
    const db = await connectDB();
    return db.collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS).findOne({
      _id: roomId,
      memberIds: userId,
      status: STUDY_ROOM_STATUS.CLOSED,
    });
  },

  /** Inserts a room inside an optional transaction session. */
  async insert(
    doc: StudyRoomDocument,
    session?: ClientSession
  ): Promise<void> {
    const db = await connectDB();
    await db
      .collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS)
      .insertOne(doc, session ? { session } : {});
  },

  /** Deletes a room by id (compensating rollback on standalone MongoDB). */
  async deleteById(roomId: ObjectId): Promise<void> {
    const db = await connectDB();
    await db
      .collection<StudyRoomDocument>(COLLECTIONS.STUDY_ROOMS)
      .deleteOne({ _id: roomId });
  },
};