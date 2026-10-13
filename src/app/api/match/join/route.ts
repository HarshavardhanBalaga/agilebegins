import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchJoinSchema } from "@/validators/match";
import { matchService } from "@/services/matchService";

export const dynamic = "force-dynamic";

/**
 * POST /api/match/join — idempotent search entry + FIFO match attempt.
 * Returns `searching` (still waiting) or `matched` (room created instantly).
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const ipBlocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.MATCH_IP,
      ...RATE_LIMITS.MATCH_IP,
      identifier: clientIp(request.headers),
    });
    if (ipBlocked) return ipBlocked;

    const user = await requireAuth(request);
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.MATCH_JOIN,
      ...RATE_LIMITS.MATCH_JOIN,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    let body: Record<string, unknown>;
    try {
      body = await readJson(request);
    } catch (error) {
      return fail(error);
    }
    const parsed = matchJoinSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const result = await matchService.join(user);
    if (result.outcome === "matched") {
      return ok({
        status: "matched",
        roomId: result.roomId,
        queueEntryId: result.queueEntryId,
        expiresAt: result.expiresAt,
      });
    }
    return ok({
      status: "searching",
      queueEntryId: result.queueEntryId,
      position: result.position,
      waitSeconds: result.waitSeconds,
      expiresAt: result.expiresAt,
    });
  });
}
