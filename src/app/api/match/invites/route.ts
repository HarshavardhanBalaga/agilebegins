import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { inviteService } from "@/services/inviteService";

export const dynamic = "force-dynamic";

/**
 * GET /api/match/invites — caller's pending inbox (incoming + outgoing).
 * Polled by the directory UI so invitees see picks without refresh.
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

    return ok(await inviteService.listInvites(user));
  });
}
