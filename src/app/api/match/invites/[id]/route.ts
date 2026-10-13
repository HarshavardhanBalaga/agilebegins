import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { toObjectId } from "@/utils/ids";
import { inviteService } from "@/services/inviteService";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/match/invites/[id] — sender-only cancel of a pending invite.
 * Accepted invites are reported (never undone); foreign ids 404.
 */
export async function DELETE(
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

    const result = await inviteService.cancelInvite(user, inviteId);
    if (result.status === "accepted") {
      return ok({ status: "accepted", roomId: result.roomId });
    }
    return ok({ status: result.status });
  });
}
