import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { toObjectId } from "@/utils/ids";
import { roomService } from "@/services/roomService";

export const dynamic = "force-dynamic";

/**
 * GET /api/room/[id]/summary — completion stats for a closed room the caller
 * belonged to (`Session complete — 45 min focused, 3 tasks`). Own rooms
 * only; foreign ids 404 with no existence oracle.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return run(async () => {
    const ipBlocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.MATCH_IP,
      ...RATE_LIMITS.MATCH_IP,
      identifier: clientIp(request.headers),
    });
    if (ipBlocked) return ipBlocked;

    const user = await requireAuth(request);
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.MATCH_ROOM,
      ...RATE_LIMITS.MATCH_ROOM,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    const { id } = await params;
    const roomId = toObjectId(id);
    return ok(await roomService.summary(user, roomId));
  });
}
