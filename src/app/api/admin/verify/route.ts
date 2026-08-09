import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { adminActionSchema } from "@/validators/registration";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/verify
 * Verifies a pending registration's payment and dispatches the confirmation
 * email (best-effort). Rejects non-pending registrations.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);

    const body = await readJson(request);
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const result = await registrationService.verifyPayment(parsed.data.id);
    return ok({
      success: true,
      confirmationEmailSent: result.confirmationEmailSent,
      message: result.confirmationEmailSent
        ? "Payment verified and confirmation email sent."
        : "Payment verified, but the confirmation email could not be sent. Use 'Send Confirmation Email' to retry.",
    });
  });
}