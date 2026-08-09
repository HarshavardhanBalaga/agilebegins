import type { NextRequest } from "next/server";
import { run, ok } from "@/lib/http";
import { requireAuth } from "@/middlewares/auth";
import { toPublicUser } from "@/models/user";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 * Returns the currently authenticated user, or a 401 when logged out.
 * The client uses this to decide whether to show the auth form or the
 * registration form on /register.
 */
export async function GET(request: NextRequest) {
  return run(async () => {
    const user = await requireAuth(request);
    return ok({ user: toPublicUser(user) });
  });
}