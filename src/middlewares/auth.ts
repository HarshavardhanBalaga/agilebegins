import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/tokens";
import { COOKIE_NAMES } from "@/lib/constants";
import { httpError } from "@/lib/http";
import { toObjectId } from "@/utils/ids";
import { userRepository } from "@/repositories/userRepository";
import type { UserDocument } from "@/models/user";

/**
 * Route guards for API handlers, plus a server-component session lookup.
 *
 * These are the enforced authorization checks. proxy.ts only performs an
 * optimistic redirect for the admin UI; every protected route re-verifies
 * the token here and loads the fresh user from the database.
 */

async function getUserFromToken(
  token: string | undefined
): Promise<UserDocument | null> {
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return userRepository.findById(toObjectId(payload.sub));
}

export async function requireAuth(request: NextRequest): Promise<UserDocument> {
  const token = request.cookies.get(COOKIE_NAMES.ACCESS)?.value;
  if (!token) {
    throw httpError.unauthorized();
  }

  const user = await getUserFromToken(token);
  if (!user) {
    throw httpError.unauthorized("Your session has expired. Please log in again.");
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

/**
 * Server-side session lookup for Server Components: reads the access cookie,
 * verifies it and loads the fresh user. Returns null when logged out or the
 * token is invalid — callers decide what to render (e.g. an auth step).
 */
export async function getSessionUser(): Promise<UserDocument | null> {
  const store = await cookies();
  return getUserFromToken(store.get(COOKIE_NAMES.ACCESS)?.value);
}
