import { DEFAULT_TTL_MS, ROLES } from "@/lib/constants";
import { userRepository } from "@/repositories/userRepository";
import { refreshTokenRepository } from "@/repositories/refreshTokenRepository";
import {
  createTokenId,
  hashToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/tokens";
import {
  isEmailVerified,
  toPublicUser,
  type PublicUser,
  type UserDocument,
} from "@/models/user";
import type { GoogleProfile } from "@/lib/google";

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

export const googleAuthService = {
  /**
   * Finds or creates the student for a Google-verified email.
   * - New account → created pre-verified (Google proved the inbox).
   * - Existing account with same email → linked + marked verified.
   */
  async loginWithGoogle(profile: GoogleProfile): Promise<{
    user: PublicUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const existing = await userRepository.findByEmail(profile.email);

    if (existing) {
      const needsVerify = !isEmailVerified(existing);
      const needsLink = !existing.googleId && Boolean(profile.sub);
      if (needsVerify || needsLink) {
        await userRepository.updateProfile(existing._id, {
          ...(needsVerify ? { emailVerified: true } : {}),
          ...(needsLink ? { googleId: profile.sub } : {}),
        });
        const refreshed = await userRepository.findByEmail(profile.email);
        if (refreshed) {
          const tokens = await issueSession(refreshed);
          return { user: toPublicUser(refreshed), ...tokens };
        }
      }
      const tokens = await issueSession(existing);
      return {
        user: toPublicUser({ ...existing, emailVerified: true }),
        ...tokens,
      };
    }

    const user = await userRepository.create({
      name: profile.name,
      email: profile.email,
      password: "",
      role: ROLES.STUDENT,
      emailVerified: true,
      googleId: profile.sub,
    });
    const tokens = await issueSession(user);
    return { user: toPublicUser(user), ...tokens };
  },
};
