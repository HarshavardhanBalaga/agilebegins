import type { NextRequest } from "next/server";
import { run, ok, fail } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchAvailableQuerySchema } from "@/validators/match";
import { inviteService } from "@/services/inviteService";

export const dynamic = "force-dynamic";

/**
 * GET /api/match/available — directory of currently-searching students.
 * Minimal preview only (displayName + avatarUrl + waitSeconds); never
 * emails or full profiles. Only live waiting entries, no room-holders.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    const ipBlocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.MATCH_IP,
      ...RATE_LIMITS.MATCH_IP,
      identifier: clientIp(request.headers),
    });
    if (ipBlocked) return ipBlocked;

    const user = await requireAuth(request);
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.MATCH_INVITES,
      ...RATE_LIMITS.MATCH_INVITES,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    const limitParam = request.nextUrl.searchParams.get("limit");
    const parsed = matchAvailableQuerySchema.safeParse(
      limitParam === null ? {} : { limit: limitParam }
    );
    if (!parsed.success) return fail(parsed.error);

    return ok(await inviteService.listAvailable(user, parsed.data.limit));
  });
}
