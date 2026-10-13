import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { run } from "@/lib/http";
import { checkState, verifyGoogleCode } from "@/lib/google";
import { googleAuthService } from "@/services/googleAuthService";
import { setAuthCookies } from "@/lib/session";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function safeReturnTo(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/app";
}

/**
 * GET /api/auth/google/callback?code=...&state=...
 * Google redirects here after consent. Verifies state (CSRF), exchanges the
 * code, creates/links the student as pre-verified, sets session cookies and
 * redirects straight to /app — no email-verification step for Google users.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    const params = request.nextUrl.searchParams;
    const code = params.get("code");
    const state = params.get("state") ?? "";
    if (params.get("error") || !code) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "google_cancelled");
      return NextResponse.redirect(url);
    }

    // state = "<nonce>.<sig>.<returnTo>"
    const lastDot = state.lastIndexOf(".");
    const signed = lastDot > 0 ? state.slice(0, lastDot) : "";
    const returnTo = safeReturnTo(
      lastDot > 0 ? state.slice(lastDot + 1) : null
    );
    if (!signed || !checkState(signed, returnTo)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "google_invalid");
      return NextResponse.redirect(url);
    }

    const profile = await verifyGoogleCode(code);
    const result = await googleAuthService.loginWithGoogle(profile);
    const dest =
      result.user.role === ROLES.ADMIN
        ? "/admin"
        : returnTo === "/admin"
          ? "/app"
          : returnTo;
    const response = NextResponse.redirect(new URL(dest, request.url));
    return setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken
    );
  });
}
