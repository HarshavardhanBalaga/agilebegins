import type { NextRequest } from "next/server";
import { run, ok, fail, httpError, readJson as readJsonBody } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { rateLimit } from "@/middlewares/rateLimit";
import {
  registrationInputSchema,
  screenshotSchema,
} from "@/validators/registration";
import { registrationService } from "@/services/registrationService";
import { normalizeText, stripHtml } from "@/lib/sanitize";
import { RATE_LIMITS, RATE_LIMIT_SCOPE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/register
 * Requires an authenticated student. Validates the full registration
 * (workshop + personal details + UPI transaction id + optional screenshot)
 * and stores a registration with status "pending".
 *
 * Duplicate registrations and duplicate transaction ids are rejected.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    const blocked = rateLimit(request, {
      scope: RATE_LIMIT_SCOPE.REGISTER,
      ...RATE_LIMITS.REGISTER,
    });
    if (blocked) return blocked;

    const user = await requireAuth(request);
    const body = await readJsonBody(request);

    const parsed = registrationInputSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);
    const data = parsed.data;

    const screenshotParsed = screenshotSchema.safeParse(
      body.screenshot ?? null
    );
    if (!screenshotParsed.success) return fail(screenshotParsed.error);

    // Students can only register with the email tied to their account.
    if (data.email !== user.email.toLowerCase().trim()) {
      return fail(
        httpError.badRequest(
          "E-mail must match the account you signed in with."
        )
      );
    }

    const registration = await registrationService.create(user, {
      workshopId: data.workshopId,
      name: stripHtml(normalizeText(data.name)),
      email: data.email,
      phone: stripHtml(normalizeText(data.phone)),
      college: stripHtml(normalizeText(data.college)),
      branch: stripHtml(normalizeText(data.branch)),
      year: stripHtml(normalizeText(data.year)),
      transactionId: stripHtml(normalizeText(data.transactionId)),
      screenshot: screenshotParsed.data ?? null,
    });

    return ok(
      {
        registration: {
          id: registration._id.toString(),
          paymentStatus: registration.paymentStatus,
        },
        message:
          "Your registration has been received. Payment verification usually takes a few hours. You'll receive an email once verified.",
      },
      { status: 201 }
    );
  });
}