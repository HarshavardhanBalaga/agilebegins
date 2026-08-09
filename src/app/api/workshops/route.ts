import { NextResponse } from "next/server";
import { workshopRepository } from "@/repositories/workshopRepository";

/**
 * GET /api/workshops
 *
 * Returns every workshop, with the featured one first and then
 * the most recently created ones first.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workshops = await workshopRepository.listPublic();
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
