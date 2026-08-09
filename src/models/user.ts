import type { ObjectId } from "mongodb";
import type { Role } from "@/lib/constants";

/**
 * A user exactly as stored in the `users` collection.
 *
 * `emailVerified` is false for brand-new student accounts until they click
 * the verification link. Accounts created before this field existed, and all
 * admin accounts, are treated as verified (see `isEmailVerified`).
 */
export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  /** bcrypt hash — never returned by any API. */
  password: string;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape passed to insertOne when creating a user. */
export type NewUser = Omit<UserDocument, "_id" | "createdAt" | "updatedAt">;

/**
 * The safe user shape exposed to clients. `emailVerified` lets the UI show a
 * "verify your email" step without another round trip.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
}

/**
 * A user is verified unless their account explicitly carries `emailVerified:
 * false`. Existing accounts (created before verification shipped) and admins
 * therefore never get locked out.
 */
export function isEmailVerified(user: Pick<UserDocument, "emailVerified">): boolean {
  return user.emailVerified !== false;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: isEmailVerified(user),
  };
}