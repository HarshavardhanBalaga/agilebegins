import type { NextRequest } from "next/server";
import { run, ok, fail, httpError } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchRoomQuerySchema } from "@/validators/match";
import { toOptionalObjectId } from "@/utils/ids";
import { matchService } from "@/services/matchService";

export const dynamic = "force-dynamic";

/**
 * GET /api/match/room — caller's active room with a minimal partner preview
 * (displayName + avatarUrl only). No room and no ?roomId= returns
 * `{ room: null, closedRoomId: null }`. A supplied ?roomId= that is not the
 * caller's active room (nor their own closed room) returns a non-revealing
 * 404 so ids cannot be used as an existence oracle. When ?roomId= names the
 * caller's own closed room, returns `{ room: null, closedRoomId }` so the
 * staying partner can see "partner left".
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
      scope: RATE_LIMIT_SCOPE.MATCH_ROOM,
      ...RATE_LIMITS.MATCH_ROOM,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    const roomIdParam = request.nextUrl.searchParams.get("roomId");
    const parsed = matchRoomQuerySchema.safeParse(
      roomIdParam === null ? {} : { roomId: roomIdParam }
    );
    if (!parsed.success) return fail(parsed.error);

    const roomId = toOptionalObjectId(parsed.data.roomId);
    const result = await matchService.room(user, roomId ?? undefined);
    if (roomId && !result.room && !result.closedRoomId) {
      throw httpError.notFound("Study room not found.");
    }
    return ok(result);
  });
}
