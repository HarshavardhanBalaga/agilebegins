import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/tokens";
import { COOKIE_NAMES } from "@/lib/constants";
import { httpError } from "@/lib/http";
import { toObjectId } from "@/utils/ids";
import { userRepository } from "@/repositories/userRepository";
import type { UserDocument } from "@/models/user";

/**
 * Route guards for API handlers.
 *
 * These are the enforced authorization checks. proxy.ts only performs an
 * optimistic redirect for the admin UI; every protected route re-verifies
 * the token here and loads the fresh user from the database.
 */

export async function requireAuth(request: NextRequest): Promise<UserDocument> {
  const token = request.cookies.get(COOKIE_NAMES.ACCESS)?.value;
  if (!token) {
    throw httpError.unauthorized();
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw httpError.unauthorized("Your session has expired. Please log in again.");
  }

  const user = await userRepository.findById(toObjectId(payload.sub));
  if (!user) {
    throw httpError.unauthorized("Account no longer exists.");
  }

  return user;
}

export async function requireAdmin(request: NextRequest): Promise<UserDocument> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw httpError.forbidden();
  }
  return user;
}