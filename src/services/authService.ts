import {
  createTokenId,
  hashToken,
  signAccessToken,
  signPurposeToken,
  signRefreshToken,
  verifyPurposeToken,
  verifyRefreshToken,
} from "@/lib/tokens";
import { hashPassword, verifyPassword } from "@/lib/password";
import { httpError } from "@/lib/http";
import { DEFAULT_TTL_MS, ROLES, TOKEN_PURPOSE } from "@/lib/constants";
import { env } from "@/lib/env";
import { userRepository } from "@/repositories/userRepository";
import { refreshTokenRepository } from "@/repositories/refreshTokenRepository";
import { toObjectId } from "@/utils/ids";
import {
  isEmailVerified,
  toPublicUser,
  type PublicUser,
  type UserDocument,
} from "@/models/user";
import { emailService } from "@/services/emailService";

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Issues an access + refresh token pair and persists the refresh token
 * (stored as a hash only) so it can be rotated and revoked later.
 */
async function issueSession(user: UserDocument): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const tokenId = createTokenId();
  const accessToken = await signAccessToken({
    id: user._id.toString(),
    role: user.role,
  });
  const refreshToken = await signRefreshToken({
    id: user._id.toString(),
    role: user.role,
    tokenId,
  });

  await refreshTokenRepository.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + DEFAULT_TTL_MS.REFRESH),
    revokedAt: null,
  });

  return { accessToken, refreshToken };
}

/**
 * Mints a verification link and emails it. Throws on SMTP failure so callers
 * can decide whether to surface it (resend) or swallow it (register).
 */
async function dispatchVerificationEmail(user: UserDocument): Promise<void> {
  const token = await signPurposeToken({
    userId: user._id.toString(),
    purpose: TOKEN_PURPOSE.EMAIL_VERIFY,
  });
  const verifyUrl = `${env.appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await emailService.sendVerificationEmail({
    email: user.email,
    name: user.name,
    verifyUrl,
  });
}

export const authService = {
  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw httpError.conflict("An account with this email already exists.");
    }

    const password = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      role: ROLES.STUDENT,
      emailVerified: false,
    });

    // Best-effort: a mail failure must not block the account — the student
    // can resend the verification email from the "verify your email" screen.
    await dispatchVerificationEmail(user).catch((error) => {
      console.error("Verification email failed:", error);
    });

    const tokens = await issueSession(user);
    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Verifies a purpose-scoped email-verification token and marks the account
   * verified. Idempotent — an already-verified account returns success.
   */
  async verifyEmail(token: string): Promise<void> {
    const payload = await verifyPurposeToken(token, TOKEN_PURPOSE.EMAIL_VERIFY);
    if (!payload) {
      throw httpError.badRequest(
        "This verification link is invalid or has expired. Please request a new one."
      );
    }

    const user = await userRepository.findById(toObjectId(payload.sub));
    if (!user) {
      throw httpError.notFound("Account not found.");
    }
    if (!isEmailVerified(user)) {
      await userRepository.markEmailVerified(user._id);
    }
  },

  /**
   * Re-sends the verification email. Fails with a clear error when the email
   * is already verified. SMTP failures are surfaced so the UI can tell the
   * student to try again.
   */
  async resendVerification(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw httpError.notFound("Account not found.");
    }
    if (isEmailVerified(user)) {
      throw httpError.conflict("Your email is already verified.");
    }
    await dispatchVerificationEmail(user);
  },

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw httpError.unauthorized("Invalid email or password.");
    }

    const passwordMatches = await verifyPassword(input.password, user.password);
    if (!passwordMatches) {
      throw httpError.unauthorized("Invalid email or password.");
    }

    const tokens = await issueSession(user);
    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Refresh rotation: the presented token is instantly revoked and replaced
   * by a fresh pair, so a stolen token cannot be replayed indefinitely.
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      throw httpError.unauthorized("Invalid refresh token.");
    }

    const hash = hashToken(refreshToken);
    const record = await refreshTokenRepository.findByHash(hash);
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw httpError.unauthorized(
        "Your session has expired. Please log in again."
      );
    }

    const user = await userRepository.findById(toObjectId(payload.sub));
    if (!user) {
      throw httpError.unauthorized("Account no longer exists.");
    }

    await refreshTokenRepository.revoke(hash);
    const tokens = await issueSession(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await refreshTokenRepository.revoke(hashToken(refreshToken));
    }
  },
};