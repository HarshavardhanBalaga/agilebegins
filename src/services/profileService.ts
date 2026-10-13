import type { UserDocument, UserProfile } from "@/models/user";
import { getProfileCompletion, toPublicUser, type PublicUser } from "@/models/user";
import { userRepository } from "@/repositories/userRepository";
import type { ProfileInput } from "@/validators/profile";

/**
 * Profile business logic for Companion Mode onboarding.
 *
 * Completion is always derived server-side via `getProfileCompletion` — the
 * client never submits a completion flag and this service never reads one.
 */

function sanitizeProfileInput(input: ProfileInput): Required<Omit<UserProfile, "avatarUrl">> & Pick<UserProfile, "avatarUrl"> {
  const interests = Array.from(
    new Set(
      input.learningInterests
        .map((v) => v.trim())
        .filter((v) => v.length >= 2)
        .slice(0, 6)
    )
  );
  return {
    displayName: input.displayName.trim(),
    avatarUrl: input.avatarUrl?.trim() ? input.avatarUrl.trim() : undefined,
    learningInterests: interests,
    learningGoals: input.learningGoals.trim(),
    studyAvailability: input.studyAvailability,
  };
}

export const profileService = {
  getStatus(user: UserDocument): {
    user: PublicUser;
    complete: boolean;
    missing: Array<keyof UserProfile>;
  } {
    const { complete, missing } = getProfileCompletion(user);
    return { user: toPublicUser(user), complete, missing };
  },

  async saveProfile(
    user: UserDocument,
    input: ProfileInput
  ): Promise<{ user: PublicUser; complete: boolean; missing: Array<keyof UserProfile> }> {
    const clean = sanitizeProfileInput(input);
    await userRepository.updateProfile(user._id, {
      displayName: clean.displayName,
      ...(clean.avatarUrl ? { avatarUrl: clean.avatarUrl } : { avatarUrl: undefined }),
      learningInterests: clean.learningInterests,
      learningGoals: clean.learningGoals,
      studyAvailability: clean.studyAvailability,
    });
    // Clearing an optional avatar stores `avatarUrl: undefined` — MongoDB
    // keeps the key as undefined; reads treat it as absent. Refetch for
    // the authoritative post-save document.
    const fresh = await userRepository.findById(user._id);
    if (!fresh) throw new Error("Account no longer exists.");
    return this.getStatus(fresh);
  },
};
