import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { rateLimit } from "@/middlewares/rateLimit";
import { passwordResetService } from "@/services/passwordResetService";
import { forgotPasswordSchema } from "@/validators/auth";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password
 * Emails a 4-digit OTP. The response is deliberately identical whether or not
 * the email exists, so the endpoint cannot be used to enumerate accounts.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.EMAIL,
      ...RATE_LIMITS.EMAIL,
    });
    if (blocked) return blocked;

    const body = await readJson(request);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    await passwordResetService.requestOtp(parsed.data.email);

    return ok({
      message:
        "If an account exists for that email, a password reset code is on its way. Check your inbox (and spam).",
    });
  });
}
