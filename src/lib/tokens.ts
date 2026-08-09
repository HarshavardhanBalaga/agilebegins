import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "@/lib/env";
import { DEFAULT_TTL_MS, type Role } from "@/lib/constants";

/**
 * JWT utilities built on `jose`.
 *
 * Both access and refresh tokens are signed HS256 JWTs. jose is used instead
 * of jsonwebtoken because it is pure Web Crypto and runs identically in Route
 * Handlers (Node runtime) and Proxy.
 */

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  role: Role;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  jti: string;
}

function encode(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(user: {
  id: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expiryEpochSeconds(DEFAULT_TTL_MS.ACCESS))
    .sign(encode(env.jwt.accessSecret()));
}

export async function signRefreshToken(user: {
  id: string;
  tokenId: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setJti(user.tokenId)
    .setIssuedAt()
    .setExpirationTime(expiryEpochSeconds(DEFAULT_TTL_MS.REFRESH))
    .sign(encode(env.jwt.refreshSecret()));
}

/**
 * jose's numeric `setExpirationTime`/`setNotBefore` arguments are UNIX
 * timestamps, not durations — passing a bare TTL in seconds would create an
 * already-expired token (epoch + TTL). Convert to an absolute epoch seconds.
 */
function expiryEpochSeconds(ttlMs: number): number {
  return Math.floor(Date.now() / 1000) + Math.floor(ttlMs / 1000);
}

/**
 * Verifies an access token and returns its payload, or null when invalid.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encode(env.jwt.accessSecret()), {
      algorithms: ["HS256"],
    });
    return {
      sub: String(payload.sub ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies a refresh token and returns its payload, or null when invalid.
 * `jti` uniquely identifies the row in the RefreshTokens collection.
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      encode(env.jwt.refreshSecret()),
      { algorithms: ["HS256"] }
    );
    return {
      sub: String(payload.sub ?? ""),
      jti: String(payload.jti ?? ""),
    };
  } catch {
    return null;
  }
}

/**
 * Reactive non-verifying access token check used by proxy.ts for optimistic
 * admin redirects. The real authorization always happens in the service layer.
 */
export async function verifyAccessTokenSignature(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encode(env.jwt.accessSecret()), {
      algorithms: ["HS256"],
    });
    return {
      sub: String(payload.sub ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Short helper so callers don't depend on a random id library directly. */
export function createTokenId(): string {
  return randomUUID();
}

/**
 * One-way hash of the raw refresh token stored in the database. The raw
 * token is never persisted, so a database leak cannot replay sessions.
 */
export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}