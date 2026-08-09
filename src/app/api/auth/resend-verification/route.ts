import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import { authService } from "@/services/authService";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/resend-verification
 * Re-sends the email-verification link for the signed-in student. Rate
 * limited to prevent mail bombing.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.EMAIL,
      ...RATE_LIMITS.EMAIL,
    });
    if (blocked) return blocked;

    const user = await requireAuth(request);
    await authService.resendVerification(user.email);

    return ok({
      message: "Verification email sent. Check your inbox (and spam).",
    });
  });
}
