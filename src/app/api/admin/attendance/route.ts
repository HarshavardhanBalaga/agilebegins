import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAdmin } from "@/middlewares/auth";
import { attendanceSchema } from "@/validators/registration";
import { registrationService } from "@/services/registrationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/attendance
 * Marks whether a student attended the workshop.
 */
export async function POST(request: NextRequest) {
  return run(async () => {
    await requireAdmin(request);

    const body = await readJson(request);
    const parsed = attendanceSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error);

    await registrationService.setAttendance(
      parsed.data.id,
      parsed.data.attendance
    );
    return ok({ success: true });
  });
}