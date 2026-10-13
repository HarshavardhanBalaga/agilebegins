import type { ObjectId } from "mongodb";
import type { Role } from "@/lib/constants";
import type { StudyAvailability } from "@/validators/profile";

/**
 * A user exactly as stored in the `users` collection.
 *
 * `emailVerified` is false for brand-new student accounts until they click
 * the verification link. Accounts created before this field existed, and all
 * admin accounts, are treated as verified (see `isEmailVerified`).
 *
 * Profile fields power Companion Mode onboarding. They are optional on the
 * document because accounts pre-date profile setup; completion is always
 * derived server-side (see `getProfileCompletion`) and never trusted from
 * the client.
 */
export interface UserProfile {
  /** Student-chosen display name (may differ from signup `name`). */
  displayName?: string;
  /** Optional remote https:// avatar image URL. No upload pipeline exists. */
  avatarUrl?: string;
  /** 1–6 free-form / preset learning interests. */
  learningInterests?: string[];
  /** Free-text current learning goals. */
  learningGoals?: string;
  /** Preferred study availability slot. */
  studyAvailability?: StudyAvailability;
}

export interface UserDocument extends UserProfile {
  _id: ObjectId;
  name: string;
  email: string;
  /** bcrypt hash — empty for Google-only accounts (never returned by any API). */
  password: string;
  role: Role;
  emailVerified: boolean;
  /** Google subject id, set when the account is created or linked via Google. */
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape passed to insertOne when creating a user. */
export type NewUser = Omit<UserDocument, "_id" | "createdAt" | "updatedAt">;

/**
 * The safe user shape exposed to clients. `emailVerified` lets the UI show a
 * "verify your email" step without another round trip. Profile fields plus a
 * server-computed `profileComplete` flag drive the /app onboarding flow.
 */
export interface PublicUser extends UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  profileComplete: boolean;
  missingProfileFields: Array<keyof UserProfile>;
}

/**
 * A user is verified unless their account explicitly carries `emailVerified:
 * false`. Existing accounts (created before verification shipped) and admins
 * therefore never get locked out.
 */
export function isEmailVerified(user: Pick<UserDocument, "emailVerified">): boolean {
  return user.emailVerified !== false;
}

export const PROFILE_REQUIRED_FIELDS = [
  "displayName",
  "learningInterests",
  "learningGoals",
  "studyAvailability",
] as const satisfies ReadonlyArray<keyof UserProfile>;

export type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

/**
 * Explicit completion criteria (no arbitrary percentages):
 * - displayName: trimmed length >= 2
 * - learningInterests: array with >= 1 non-empty entry
 * - learningGoals: trimmed length >= 10
 * - studyAvailability: one of the allowed enum values (checked by callers
 *   via zod; here we only check non-empty)
 *
 * `avatarUrl` is optional and never blocks completion.
 */
export function getProfileCompletion(user: Pick<UserDocument, keyof UserProfile>): {
  complete: boolean;
  missing: Array<keyof UserProfile>;
} {
  const missing: Array<keyof UserProfile> = [];

  if (!user.displayName || user.displayName.trim().length < 2) {
    missing.push("displayName");
  }
  const interests = Array.isArray(user.learningInterests)
    ? user.learningInterests.filter((v) => typeof v === "string" && v.trim().length > 0)
    : [];
  if (interests.length < 1) {
    missing.push("learningInterests");
  }
  if (!user.learningGoals || user.learningGoals.trim().length < 10) {
    missing.push("learningGoals");
  }
  if (!user.studyAvailability) {
    missing.push("studyAvailability");
  }

  return { complete: missing.length === 0, missing };
}

export function toPublicUser(user: UserDocument): PublicUser {
  const { complete, missing } = getProfileCompletion(user);
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: isEmailVerified(user),
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    learningInterests: user.learningInterests,
    learningGoals: user.learningGoals,
    studyAvailability: user.studyAvailability,
    profileComplete: complete,
    missingProfileFields: missing,
  };
}
