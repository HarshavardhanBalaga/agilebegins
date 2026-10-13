import type { NextRequest } from "next/server";
import { run, ok, fail } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchRoomQuerySchema } from "@/validators/match";
import { toOptionalObjectId } from "@/utils/ids";
import { matchService } from "@/services/matchService";

export const dynamic = "force-dynamic";

/**
 * GET /api/match/room — caller's active room with a minimal partner preview
 * (displayName + avatarUrl only). Unknown or foreign room ids return
 * `{ room: null }` so ids cannot be used as an existence oracle.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
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
    return ok(await matchService.room(user, roomId ?? undefined));
  });
}
