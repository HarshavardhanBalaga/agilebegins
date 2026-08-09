import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { loginSchema } from "@/validators/auth";
import { authService } from "@/services/authService";
import { setAuthCookies } from "@/lib/session";
import { rateLimit } from "@/middlewares/rateLimit";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Verifies credentials and issues a fresh access + refresh token pair as
 * HTTP-only cookies.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.AUTH,
      ...RATE_LIMITS.AUTH,
    });
    if (blocked) return blocked;

    const body = await readJson(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const result = await authService.login(parsed.data);
    const response = ok({ user: result.user });
    return setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken
    );
  });
}