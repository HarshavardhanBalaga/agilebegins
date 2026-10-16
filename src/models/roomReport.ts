import type { ObjectId } from "mongodb";

/**
 * A safety report filed from inside a room. Stored for later admin review;
 * the MVP surfaces no admin UI for it yet.
 */
export interface RoomReportDocument {
  _id: ObjectId;
  roomId: ObjectId;
  reporterId: ObjectId;
  reportedId: ObjectId;
  /** Sanitized optional reason (stripHtml + length cap). */
  reason: string;
  createdAt: Date;
}
