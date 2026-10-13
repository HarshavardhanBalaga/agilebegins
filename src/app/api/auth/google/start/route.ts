import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { run } from "@/lib/http";
import { buildGoogleAuthUrl, signState } from "@/lib/google";

export const dynamic = "force-dynamic";

function safeReturnTo(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/app";
}

/**
 * GET /api/auth/google/start?next=/app
 * Redirects to Google's consent screen. Used by both login and signup —
 * Google tells us the verified email, so one button covers both.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    const returnTo = safeReturnTo(
      request.nextUrl.searchParams.get("next")
    );
    const state = signState(returnTo);
    const url = buildGoogleAuthUrl(`${state}.${returnTo}`);
    return NextResponse.redirect(url);
  });
}
