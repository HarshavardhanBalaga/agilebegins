import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { WorkshopDocument } from "@/types/workshop";
import type { ObjectId } from "mongodb";

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