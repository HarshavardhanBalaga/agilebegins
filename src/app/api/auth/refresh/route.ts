import type { NextRequest } from "next/server";
import { run, ok, httpError } from "@/lib/http";
import { authService } from "@/services/authService";
import { setAuthCookies } from "@/lib/session";
import { COOKIE_NAMES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/refresh
 * Rotates the refresh token: the presented token is revoked and a brand new
 * access + refresh pair is issued as cookies.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH)?.value;
    if (!refreshToken) {
      throw httpError.unauthorized();
    }

    const result = await authService.refresh(refreshToken);
    const response = ok({ user: result.user });
    return setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken
    );
  });
}