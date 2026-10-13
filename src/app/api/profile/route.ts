import type { NextRequest } from "next/server";
import { run, ok, fail, readJson } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { profileSchema } from "@/validators/profile";
import { profileService } from "@/services/profileService";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile — returns the signed-in student's profile plus a
 * server-computed completion status. Never trusts client flags.
 * PUT /api/profile — validates + persists profile setup fields.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    const user = await requireAuth(request);
    return ok(profileService.getStatus(user));
  });
}

export async function PUT(request: NextRequest) {
  return run(async () => {
    const user = await requireAuth(request);
    const body = await readJson(request);
    const parsed = profileSchema.safeParse({
      displayName: body.displayName,
      avatarUrl:
        typeof body.avatarUrl === "string" && body.avatarUrl.trim() === ""
          ? undefined
          : body.avatarUrl,
      learningInterests: body.learningInterests,
      learningGoals: body.learningGoals,
      studyAvailability: body.studyAvailability,
    });
    if (!parsed.success) return fail(parsed.error);
    const result = await profileService.saveProfile(user, parsed.data);
    return ok(result);
  });
}
