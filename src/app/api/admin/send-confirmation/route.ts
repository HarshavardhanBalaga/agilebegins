import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { adminActionSchema } from "@/validators/registration";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/send-confirmation
 * Re-sends the confirmation email for a registration (e.g. after an earlier
 * SMTP failure) and records that the mail + meeting link were dispatched.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);

    const body = await readJson(request);
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    const result = await registrationService.resendConfirmation(parsed.data.id);
    return ok({
      success: true,
      confirmationEmailSent: result.confirmationEmailSent,
      message: result.confirmationEmailSent
        ? "Confirmation email sent."
        : "Could not send the email right now. Please try again shortly.",
    });
  });
}