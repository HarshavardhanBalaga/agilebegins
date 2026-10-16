import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE, ROOM_TIMER_PHASE } from "@/lib/constants";
import { toObjectId } from "@/utils/ids";
import { ROOM_TIMER_DEFAULTS, roomTimerSchema } from "@/validators/room";
import { roomService } from "@/services/roomService";

export const dynamic = "force-dynamic";

/**
 * POST /api/room/[id]/timer — drives the shared focus timer
 * (start / pause / resume / finish). Either member may act; last write wins
 * and both see the same server clock. Returns the fresh room state.
 */
export async function POST(
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
    let body: unknown;
    try {
      body = await readJson(request);
    } catch (error) {
      return fail(error);
    }
    const parsed = roomTimerSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);
    const phase =
      parsed.data.phase === "break" ? ROOM_TIMER_PHASE.BREAK : ROOM_TIMER_PHASE.FOCUS;
    const durationSec =
      parsed.data.action === "start"
        ? (parsed.data.durationSec ?? ROOM_TIMER_DEFAULTS[parsed.data.phase ?? "focus"])
        : undefined;
    return ok(await roomService.timer(user, roomId, parsed.data.action, phase, durationSec));
  });
}
