import type { ObjectId } from "mongodb";

export type WorkshopStatus = "LIVE" | "COMING_SOON";

export interface WorkshopTimelineItem {
  title: string;
  description: string;
}

export interface WorkshopFaq {
  question: string;
  answer: string;
}

/**
 * A workshop exactly as stored in the `workshops` collection.
 *
 * `_id` is a MongoDB ObjectId, and the timestamps are native Date objects.
 */
export interface WorkshopDocument {
  _id: ObjectId;
  slug: string;
  number: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number | null;
  status: WorkshopStatus;
  date: string;
  time: string;
  duration: string;
  platform: string;
  meetingPlatform: string;
  bannerImage: string | null;
  learningPoints: string[];
  timeline: WorkshopTimelineItem[];
  faqs: WorkshopFaq[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A workshop as returned by the API, with `_id` and timestamps serialized
 * to JSON-safe strings.
 */
export interface Workshop
  extends Omit<WorkshopDocument, "_id" | "createdAt" | "updatedAt"> {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A workshop ready to be inserted (MongoDB generates `_id` automatically).
 */
export type NewWorkshop = Omit<WorkshopDocument, "_id">;

/**
 * The brief shape returned by GET /api/workshops.
 */
export interface WorkshopListItem {
  _id: string;
  number: string;
  slug: string;
  title: string;
  price: number;
  status: WorkshopStatus;
}