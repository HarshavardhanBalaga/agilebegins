import type { ObjectId } from "mongodb";
import type { Role } from "@/lib/constants";

/**
 * A user exactly as stored in the `users` collection.
 */
export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  /** bcrypt hash — never returned by any API. */
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape passed to insertOne when creating a user. */
export type NewUser = Omit<UserDocument, "_id" | "createdAt" | "updatedAt">;

/** The safe user shape exposed to clients. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}