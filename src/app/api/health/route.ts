import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

/**
 * Health check endpoint.
 *
 * GET /api/health
 *
 * Verifies that MongoDB is reachable and returns a JSON status payload.
 */
export async function GET() {
  try {
    // Attempt to establish/reuse the MongoDB connection.
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB Connected",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Connection Failed",
      },
      { status: 500 }
    );
  }
}
