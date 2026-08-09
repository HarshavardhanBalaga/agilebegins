import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { registerSchema } from "@/validators/auth";
import { authService } from "@/services/authService";
import { setAuthCookies } from "@/lib/session";
import { rateLimit } from "@/middlewares/rateLimit";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Creates a student account and issues an access + refresh token pair as
 * HTTP-only cookies. Rate limited to slow brute-force signups.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.AUTH,
      ...RATE_LIMITS.AUTH,
    });
    if (blocked) return blocked;

    const body = await readJson(request);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const result = await authService.register(parsed.data);
    const response = ok({ user: result.user });
    return setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken
    );
  });
}