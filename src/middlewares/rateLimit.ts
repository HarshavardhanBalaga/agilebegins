import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isRateLimited, clientIp } from "@/lib/rateLimiter";

/**
 * Rate-limit guard for route handlers. Returns a 429 NextResponse when a
 * client exceeds the window, or null when the request may proceed.
 */
export function rateLimit(request: NextRequest, options: {
  scope: string;
  limit: number;
  windowMs: number;
}): NextResponse | null {
  const { limited, retryAfterSeconds } = isRateLimited({
    identifier: clientIp(request.headers),
    scope: options.scope,
    limit: options.limit,
    windowMs: options.windowMs,
  });

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  return null;
}