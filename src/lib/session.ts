import type { NextResponse } from "next/server";
import { COOKIE_NAMES, DEFAULT_TTL_MS } from "@/lib/constants";
import { env } from "@/lib/env";

const COOKIE_BASE = {
  httpOnly: true,
  secure: env.isProduction(),
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Attaches the access + refresh tokens as HTTP-only, Secure, SameSite=Lax
 * cookies on the response. The frontend never reads either token from JS.
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  response.cookies.set(COOKIE_NAMES.ACCESS, accessToken, {
    ...COOKIE_BASE,
    maxAge: DEFAULT_TTL_MS.ACCESS / 1000,
  });
  response.cookies.set(COOKIE_NAMES.REFRESH, refreshToken, {
    ...COOKIE_BASE,
    maxAge: DEFAULT_TTL_MS.REFRESH / 1000,
  });
  return response;
}

/** Expires both auth cookies immediately (logout). */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAMES.ACCESS, "", { ...COOKIE_BASE, maxAge: 0 });
  response.cookies.set(COOKIE_NAMES.REFRESH, "", { ...COOKIE_BASE, maxAge: 0 });
  return response;
}