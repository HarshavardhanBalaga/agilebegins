import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { rateLimit } from "@/middlewares/rateLimit";
import { passwordResetService } from "@/services/passwordResetService";
import { resetPasswordSchema } from "@/validators/auth";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reset-password
 * Verifies the emailed 4-digit OTP and sets a new password. On success the
 * student can log straight in with it. Rate limited to throttle brute force.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.AUTH,
      ...RATE_LIMITS.AUTH,
    });
    if (blocked) return blocked;

    const body = await readJson(request);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    await passwordResetService.resetPassword(parsed.data);

    return ok({
      message: "Your password has been reset. You can now log in.",
    });
  });
}
