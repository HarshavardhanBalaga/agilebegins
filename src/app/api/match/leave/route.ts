import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchLeaveSchema } from "@/validators/match";
import { toOptionalObjectId } from "@/utils/ids";
import { matchService } from "@/services/matchService";

export const dynamic = "force-dynamic";

/**
 * POST /api/match/leave — closes the caller's active study room (bilateral:
 * closed for both members). Idempotent: no active room → 200 idle.
 * An optional `roomId` must equal the caller's active room, else 404.
 * Leave never touches match_queue; queue exit stays on POST cancel.
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
      scope: RATE_LIMIT_SCOPE.MATCH_LEAVE,
      ...RATE_LIMITS.MATCH_LEAVE,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    let body: Record<string, unknown>;
    try {
      body = await readJson(request);
    } catch (error) {
      return fail(error);
    }
    const parsed = matchLeaveSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const roomId = toOptionalObjectId(parsed.data.roomId);
    const result = await matchService.leave(user, roomId ?? undefined);
    return ok({ status: result.status, roomId: result.roomId });
  });
}
