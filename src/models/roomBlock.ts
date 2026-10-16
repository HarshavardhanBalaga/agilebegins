import type { ObjectId } from "mongodb";

/**
 * A one-way block: `blockerId` never wants to be matched with `blockedId`
 * again. Enforced in FIFO join, pick-from-list directory/invite/accept, so
 * both entry points respect it.
 */
export interface RoomBlockDocument {
  _id: ObjectId;
  roomId: ObjectId;
  blockerId: ObjectId;
  blockedId: ObjectId;
  createdAt: Date;
}
