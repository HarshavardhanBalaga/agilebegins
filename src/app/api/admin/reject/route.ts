import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { adminActionSchema } from "@/validators/registration";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reject
 * Marks a pending registration's payment as rejected.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);

    const body = await readJson(request);
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    await registrationService.rejectPayment(parsed.data.id);
    return ok({ success: true });
  });
}