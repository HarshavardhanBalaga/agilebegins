import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/tokens";
import { COOKIE_NAMES, ROLES } from "@/lib/constants";

/**
 * Proxy (Next 16's middleware) — optimistic route protection.
 *
 * /admin requires an admin token; /app requires any signed-in user.
 * /login and /signup bounce already-signed-in users to their home surface
 * (/app for students, /admin for admins) so they never see the forms again.
 *
 * Access tokens live 15 minutes while sessions live 7 days via the refresh
 * cookie. Page navigations never run the client fetch wrapper, so when the
 * access token is expired but a refresh cookie exists the proxy attempts one
 * silent refresh against the real /api/auth/refresh route (Node runtime, owns
 * the DB) and lets the request through with the rotated cookies. The route
 * handler / page below still re-verifies via requireAuth()/requireAdmin()/
 * getSessionUser() — proxy is never the security boundary, per Next docs.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAMES.ACCESS)?.value;
  let payload = token ? await verifyAccessToken(token) : null;

  // Expired access token but a session still exists? Recover it once so the
  // user is not bounced to /login every 15 minutes. The fresh cookies are
  // attached to whichever response this handler returns below.
  let refreshedCookies: string[] | null = null;
  if (!payload && request.cookies.has(COOKIE_NAMES.REFRESH)) {
    const recovered = await tryRefresh(request);
    if (recovered) {
      payload = recovered.payload;
      refreshedCookies = recovered.cookies;
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!payload || payload.role !== ROLES.ADMIN) {
      const url = new URL("/login", request.url);
      const target = pathname + request.nextUrl.search;
      url.searchParams.set("next", target || "/admin");
      return NextResponse.redirect(url);
    }
    return withSessionCookies(NextResponse.next(), refreshedCookies);
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!payload) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", "/app");
      // A failed refresh leaves a dead refresh cookie behind; the login page
      // bounce would loop forever on it, so hand the user a clean slate.
      return withSessionCookies(NextResponse.redirect(url), refreshedCookies);
    }
    if (payload.role === ROLES.ADMIN) {
      return withSessionCookies(
        NextResponse.redirect(new URL("/admin", request.url)),
        refreshedCookies
      );
    }
    return withSessionCookies(NextResponse.next(), refreshedCookies);
  }

  // Already signed in? Skip the auth forms and go straight home.
  if (pathname === "/login" || pathname === "/signup") {
    if (payload) {
      return withSessionCookies(
        NextResponse.redirect(
          new URL(payload.role === ROLES.ADMIN ? "/admin" : "/app", request.url)
        ),
        refreshedCookies
      );
    }
  }

  return withSessionCookies(NextResponse.next(), refreshedCookies);
}

/**
 * One silent session recovery: POSTs the request's cookies to the real
 * refresh route and returns the fresh access payload plus its Set-Cookie
 * headers. Returns null when the session itself is dead (revoked / expired),
 * in which case callers fall through to the normal logged-out redirects.
 */
async function tryRefresh(
  request: NextRequest
): Promise<{ payload: AccessTokenPayload; cookies: string[] } | null> {
  try {
    const refreshUrl = new URL("/api/auth/refresh", request.url);
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (!response.ok) return null;
    const cookies = getSetCookies(response);
    if (cookies.length === 0) return null;
    const access = readCookie(cookies, COOKIE_NAMES.ACCESS);
    const payload = access ? await verifyAccessToken(access) : null;
    if (!payload) return null;
    return { payload, cookies };
  } catch {
    // Refresh endpoint unreachable (cold start, DB down): treat the user as
    // logged out for this navigation instead of crashing the request.
    return null;
  }
}

/** Copies raw Set-Cookie headers from the refresh response onto ours. */
function withSessionCookies(
  response: NextResponse,
  cookies: string[] | null
): NextResponse {
  if (cookies) {
    for (const cookie of cookies) {
      response.headers.append("set-cookie", cookie);
    }
  }
  return response;
}

/** Reads every Set-Cookie header without relying on getSetCookie(). */
function getSetCookies(response: Response): string[] {
  const anyHeaders = response.headers as unknown as {
    getSetCookie?: () => string[];
  };
  if (typeof anyHeaders.getSetCookie === "function") {
    return anyHeaders.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

/** Extracts one cookie value from raw Set-Cookie header strings. */
function readCookie(cookies: string[], name: string): string | null {
  const prefix = `${name}=`;
  for (const cookie of cookies) {
    const first = cookie.split(";", 1)[0]?.trim() ?? "";
    if (first.startsWith(prefix)) {
      return decodeURIComponent(first.slice(prefix.length));
    }
  }
  return null;
}

export const config = {
  matcher: ["/admin/:path*", "/app/:path*", "/login", "/signup"],
};