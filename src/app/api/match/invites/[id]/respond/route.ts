import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchInviteRespondSchema } from "@/validators/match";
import { toObjectId } from "@/utils/ids";
import { inviteService } from "@/services/inviteService";

export const dynamic = "force-dynamic";

/**
 * POST /api/match/invites/[id]/respond — accept (transactional room commit)
 * or decline an invite. Accept re-validates both parties and neither having
 * an active room; any loss is a clean 409/404, never a half-room.
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
      scope: RATE_LIMIT_SCOPE.MATCH_RESPOND,
      ...RATE_LIMITS.MATCH_RESPOND,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    const { id } = await params;
    const inviteId = toObjectId(id);

    let body: Record<string, unknown>;
    try {
      body = await readJson(request);
    } catch (error) {
      return fail(error);
    }
    const parsed = matchInviteRespondSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const result = await inviteService.respond(user, inviteId, parsed.data.action);
    if (result.status === "accepted") {
      return ok({ status: "accepted", roomId: result.roomId });
    }
    return ok({ status: "declined" });
  });
}
