import type { ObjectId } from "mongodb";

/**
 * One chat message inside a study room. Minimal coordination only —
 * plain text + emoji, no threads/attachments/reactions in the MVP.
 */
export interface RoomMessageDocument {
  _id: ObjectId;
  roomId: ObjectId;
  senderId: ObjectId;
  /** Sanitized plain text (stripHtml + length cap). */
  text: string;
  createdAt: Date;
}
