import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import type {
  WorkshopDocument,
  WorkshopListItem,
} from "@/types/workshop";

const WORKSHOPS_COLLECTION = "workshops";

// Only the fields the workshop grid needs — keep the payload small.
const LIST_PROJECTION = {
  number: 1,
  slug: 1,
  title: 1,
  price: 1,
  status: 1,
} as const;

/**
 * GET /api/workshops
 *
 * Returns every workshop, with the featured one first and then
 * the most recently created ones first.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await connectDB();
    const docs = await db
      .collection<WorkshopDocument>(WORKSHOPS_COLLECTION)
      .find({}, { projection: LIST_PROJECTION })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    const workshops: WorkshopListItem[] = docs.map((doc) => ({
      _id: doc._id.toString(),
      number: doc.number,
      slug: doc.slug,
      title: doc.title,
      price: doc.price,
      status: doc.status,
    }));

    return NextResponse.json(workshops);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch workshops.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}