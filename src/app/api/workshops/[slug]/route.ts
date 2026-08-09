import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import type { Workshop, WorkshopDocument } from "@/types/workshop";

const WORKSHOPS_COLLECTION = "workshops";

interface WorkshopRouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Converts a MongoDB document (ObjectId + Date) into the JSON-safe
 * `Workshop` shape that consumers of the API expect.
 */
function serializeWorkshop(doc: WorkshopDocument): Workshop {
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * GET /api/workshops/[slug]
 *
 * Returns the full workshop matching the slug.
 * Responds with 404 when no workshop has that slug.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: WorkshopRouteContext
) {
  const { slug } = await params;

  if (!slug || !slug.trim()) {
    return NextResponse.json(
      { error: "A workshop slug is required." },
      { status: 400 }
    );
  }

  try {
    const db = await connectDB();
    const doc = await db
      .collection<WorkshopDocument>(WORKSHOPS_COLLECTION)
      .findOne({ slug: slug.trim() });

    if (!doc) {
      return NextResponse.json(
        { error: `Workshop with slug "${slug}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeWorkshop(doc));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch workshop.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}