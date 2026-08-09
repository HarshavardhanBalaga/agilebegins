import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/tokens";
import { COOKIE_NAMES, ROLES } from "@/lib/constants";

/**
 * Proxy (Next 16's middleware) — optimistic admin route protection.
 *
 * This only performs a quick JWT signature check for the admin UI. The real
 * authorization always happens again in the route handlers via requireAdmin().
 * Per Next docs, proxy must not be the sole auth boundary.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAMES.ACCESS)?.value;
    const payload = token ? await verifyAccessToken(token) : null;

    if (!payload || payload.role !== ROLES.ADMIN) {
      const url = new URL("/login", request.url);
      const target = pathname + request.nextUrl.search;
      url.searchParams.set("next", target || "/admin");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};