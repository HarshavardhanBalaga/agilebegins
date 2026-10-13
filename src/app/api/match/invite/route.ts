import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { clientIp } from "@/lib/rateLimiter";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";
import { matchInviteSchema } from "@/validators/match";
import { toObjectId } from "@/utils/ids";
import { inviteService } from "@/services/inviteService";

export const dynamic = "force-dynamic";

/**
 * POST /api/match/invite — pick a student from the directory.
 * Idempotent per pair; a reverse pending invite surfaces 409
 * PENDING_INVITE_EXISTS so the client can offer Accept instead.
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
      scope: RATE_LIMIT_SCOPE.MATCH_INVITE,
      ...RATE_LIMITS.MATCH_INVITE,
      identifier: user._id.toHexString(),
    });
    if (blocked) return blocked;

    let body: Record<string, unknown>;
    try {
      body = await readJson(request);
    } catch (error) {
      return fail(error);
    }
    const parsed = matchInviteSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const toUserId = toObjectId(parsed.data.toUserId);
    return ok(await inviteService.sendInvite(user, toUserId));
  });
}
