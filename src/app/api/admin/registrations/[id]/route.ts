import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { registrationService } from "@/services/registrationService";

interface Context {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/registrations/[id]
 * Admin-only. Returns the full registration detail — every field plus the
 * payment screenshot (base64) — for the detail drawer and verification.
 */
export async function GET(request: NextRequest, { params }: Context) {
  return run(async () => {
    await requireAdmin(request);
    const { id } = await params;
    const registration = await registrationService.detailById(id);

    return ok({ registration });
  });
}