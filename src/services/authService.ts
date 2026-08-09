import {
  createTokenId,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/tokens";
import { hashPassword, verifyPassword } from "@/lib/password";
import { httpError } from "@/lib/http";
import { DEFAULT_TTL_MS, ROLES } from "@/lib/constants";
import { userRepository } from "@/repositories/userRepository";
import { refreshTokenRepository } from "@/repositories/refreshTokenRepository";
import { toObjectId } from "@/utils/ids";
import { toPublicUser, type PublicUser, type UserDocument } from "@/models/user";

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
    });

    const tokens = await issueSession(user);
    return { user: toPublicUser(user), ...tokens };
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