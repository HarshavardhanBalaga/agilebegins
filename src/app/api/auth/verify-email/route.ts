import type { NextRequest } from "next/server";
import { z } from "zod";
import { run, ok, fail } from "@/lib/http";
import { authService } from "@/services/authService";
import { rateLimit } from "@/middlewares/rateLimit";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().trim().min(1, { error: "Verification token is required." }),
});

/**
 * POST /api/auth/verify-email
 * Verifies a purpose-scoped email-verification token (from the link emailed
 * at signup) and marks the account verified. Idempotent.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.AUTH,
      ...RATE_LIMITS.AUTH,
    });
    if (blocked) return blocked;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return fail(new Error("Invalid JSON body."));
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return fail(parsed.error);

    await authService.verifyEmail(parsed.data.token);
    return ok({ success: true });
  });
}
