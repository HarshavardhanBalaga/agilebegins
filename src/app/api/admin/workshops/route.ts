import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/workshops
 *
 * Admin-only. Returns every workshop with its registration breakdown
 * (total / pending / verified / rejected / attended) so the dashboard can
 * render the per-workshop tab bar. Workshops with no registrations appear
 * with zeroed counts.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);
    const workshops = await registrationService.adminSummary();
    return ok({ workshops });
  });
}
