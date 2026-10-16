import type { ObjectId } from "mongodb";

/**
 * One shared task inside a study room. Deliberately flat — no subtasks,
 * priorities, or assignments. Either member can add/toggle; completion
 * records who did it for the "3 tasks completed" summary.
 */
export interface RoomTaskDocument {
  _id: ObjectId;
  roomId: ObjectId;
  /** Sanitized plain text (stripHtml + length cap). */
  text: string;
  completed: boolean;
  completedBy?: ObjectId;
  completedAt?: Date;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
