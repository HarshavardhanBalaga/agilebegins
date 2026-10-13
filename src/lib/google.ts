import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { httpError } from "@/lib/http";
import { env } from "@/lib/env";

/**
 * Google OAuth 2.0 (authorization-code flow) + OpenID Connect id_token
 * verification. Plain fetch + jose, no extra packages.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return jwks;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

export function googleCallbackUrl(): string {
  return `${env.appUrl()}/api/auth/google/callback`;
}

/** Builds the Google consent-screen URL. `state` binds the callback to our session. */
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.google().clientId,
    redirect_uri: googleCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchanges the authorization code for tokens, then verifies the id_token. */
export async function verifyGoogleCode(code: string): Promise<GoogleProfile> {
  const google = env.google();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: google.clientId,
      client_secret: google.clientSecret,
      redirect_uri: googleCallbackUrl(),
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!res.ok) {
    throw httpError.badRequest("Google sign-in failed. Please try again.");
  }
  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) {
    throw httpError.badRequest("Google sign-in failed. Please try again.");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(tokens.id_token, getJwks(), {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: google.clientId,
    }));
  } catch {
    throw httpError.badRequest("Google sign-in failed. Please try again.");
  }

  const email = String(payload.email ?? "")
    .toLowerCase()
    .trim();
  if (!email || payload.email_verified !== true) {
    throw httpError.badRequest(
      "Google could not verify your email. Please try another account."
    );
  }

  const fallbackName = email.split("@")[0] ?? "Student";
  return {
    sub: String(payload.sub ?? ""),
    email,
    name: String(payload.name ?? "").trim() || fallbackName,
  };
}

/** Signed state value so the callback can't be forged (CSRF). */
export function signState(returnTo: string): string {
  const nonce = randomBytes(16).toString("hex");
  const sig = createHash("sha256")
    .update(`${nonce}.${returnTo}.${env.jwt.accessSecret()}`)
    .digest("hex");
  return `${nonce}.${sig}`;
}

/** Validates the state echoed back by Google. */
export function checkState(state: string, returnTo: string): boolean {
  const [nonce, sig] = state.split(".");
  if (!nonce || !sig) return false;
  const expected = createHash("sha256")
    .update(`${nonce}.${returnTo}.${env.jwt.accessSecret()}`)
    .digest("hex");
  return sig === expected;
}
