import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { authService } from "@/services/authService";
import { clearAuthCookies } from "@/lib/session";
import { COOKIE_NAMES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 * Revokes the current refresh token in the database and clears both auth
 * cookies. Always succeeds — logging out an already-logged-out user is fine.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH)?.value;
    await authService.logout(refreshToken);
    return clearAuthCookies(ok({ success: true }));
  });
}