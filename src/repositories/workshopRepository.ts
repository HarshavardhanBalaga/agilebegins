import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { WorkshopDocument, WorkshopListItem } from "@/types/workshop";
import type { ObjectId } from "mongodb";

// Only the fields the workshop grid and register form need — keep the
// payload small.
const LIST_PROJECTION = {
  number: 1,
  slug: 1,
  title: 1,
  price: 1,
  status: 1,
} as const;

/**
 * Data access for the `workshops` collection. Workshop CRUD is not exposed
 * via this backend yet; only reads used by registration and admin views.
 */
export const workshopRepository = {
  async findById(id: ObjectId): Promise<WorkshopDocument | null> {
    const db = await connectDB();
    return db
      .collection<WorkshopDocument>(COLLECTIONS.WORKSHOPS)
      .findOne({ _id: id });
  },

  async findBySlug(slug: string): Promise<WorkshopDocument | null> {
    const db = await connectDB();
    const normalized = slug.trim().toLowerCase();
    return db
      .collection<WorkshopDocument>(COLLECTIONS.WORKSHOPS)
      .findOne({
        $or: [{ slug: normalized }, { aliases: normalized }],
      });
  },

  /**
   * Every workshop, featured first then most recently created, as the brief
   * public list shape. Shared by the API route and server-rendered pages.
   */
  async listPublic(): Promise<WorkshopListItem[]> {
    const db = await connectDB();
    const docs = await db
      .collection<WorkshopDocument>(COLLECTIONS.WORKSHOPS)
      .find({}, { projection: LIST_PROJECTION })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    return docs.map((doc) => ({
      _id: doc._id.toString(),
      number: doc.number,
      slug: doc.slug,
      title: doc.title,
      price: doc.price,
      status: doc.status,
    }));
  },

  /**
   * Saves the per-workshop email settings (meeting link, WhatsApp link,
   * subject, custom body). Null values clear the field so env fallbacks apply.
   */
  async updateEmailSettings(
    id: ObjectId,
    settings: {
      meetingLink?: string | null;
      whatsappLink?: string | null;
      emailSubject?: string | null;
      emailBody?: string | null;
    }
  ): Promise<void> {
    const db = await connectDB();
    await db
      .collection<WorkshopDocument>(COLLECTIONS.WORKSHOPS)
      .updateOne({ _id: id }, { $set: { ...settings, updatedAt: new Date() } });
  },

  /**
   * Returns the first LIVE workshop ordered by creation, or the most recent
   * workshop if none is live. Used as the default target for the register
   * flow when no workshop is chosen.
   */
  async findDefaultForRegistration(): Promise<WorkshopDocument | null> {
    const db = await connectDB();
    const live = await db
      .collection<WorkshopDocument>(COLLECTIONS.WORKSHOPS)
      .findOne({ status: "LIVE" }, { sort: { createdAt: -1 } });
    if (live) return live;
    return db
      .collection<WorkshopDocument>(COLLECTIONS.WORKSHOPS)
      .findOne({}, { sort: { createdAt: -1 } });
  },
};