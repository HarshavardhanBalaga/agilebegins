import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchService } from "@/services/matchService";

export const dynamic = "force-dynamic";

/**
 * GET /api/match/status — poll current state; refreshes the queue heartbeat
 * while searching so refresh/disconnect can re-attach.
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
      scope: RATE_LIMIT_SCOPE.MATCH_STATUS,
      ...RATE_LIMITS.MATCH_STATUS,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    const result = await matchService.status(user);
    if (result.status === "matched") {
      return ok({ status: "matched", roomId: result.roomId });
    }
    if (result.status === "searching") {
      return ok({
        status: "searching",
        queueEntryId: result.queueEntryId,
        position: result.position,
        waitSeconds: result.waitSeconds,
        expiresAt: result.expiresAt,
      });
    }
    return ok({
      status: "idle",
      roomId: null,
      profileComplete: result.profileComplete,
      missing: result.missing,
    });
  });
}
