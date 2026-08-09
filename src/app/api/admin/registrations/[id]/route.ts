import type { NextRequest } from "next/server";
import { run, ok, httpError } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { registrationRepository } from "@/repositories/registrationRepository";
import { toObjectId } from "@/utils/ids";

interface Context {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/registrations/[id]
 * Admin-only. Returns the full registration including the payment screenshot
 * (base64) so it can be displayed for verification.
 */
export async function GET(request: NextRequest, { params }: Context) {
  return run(async () => {
    await requireAdmin(request);
    const { id } = await params;

    const registration = await registrationRepository.findById(
      toObjectId(id)
    );
    if (!registration) {
      throw httpError.notFound("Registration not found.");
    }

    return ok({
      registration: {
        id: registration._id.toString(),
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        college: registration.college,
        branch: registration.branch,
        year: registration.year,
        transactionId: registration.transactionId,
        screenshot: registration.screenshot ?? null,
        paymentStatus: registration.paymentStatus,
        createdAt: registration.createdAt.toISOString(),
      },
    });
  });
}