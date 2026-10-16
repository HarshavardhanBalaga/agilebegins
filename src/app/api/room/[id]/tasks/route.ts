import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { toObjectId } from "@/utils/ids";
import { roomTaskCreateSchema } from "@/validators/room";
import { roomService } from "@/services/roomService";

export const dynamic = "force-dynamic";

/**
 * POST /api/room/[id]/tasks — adds one shared task (20 open-task cap).
 * Returns the fresh room state.
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
    const parsed = roomTaskCreateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);
    return ok(await roomService.addTask(user, roomId, parsed.data.text));
  });
}
