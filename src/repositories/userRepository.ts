import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import type { UserDocument, NewUser } from "@/models/user";
import { ObjectId } from "mongodb";

/**
 * Data access for the `users` collection. No business rules live here —
 * only find/create helpers used by the auth service.
 */
export const userRepository = {
  async findByEmail(email: string): Promise<UserDocument | null> {
    const db = await connectDB();
    return db
      .collection<UserDocument>(COLLECTIONS.USERS)
      .findOne({ email: email.toLowerCase().trim() });
  },

  async findById(id: ObjectId): Promise<UserDocument | null> {
    const db = await connectDB();
    return db
      .collection<UserDocument>(COLLECTIONS.USERS)
      .findOne({ _id: id });
  },

  async create(user: NewUser): Promise<UserDocument> {
    const db = await connectDB();
    const _id = new ObjectId();
    const now = new Date();
    const doc: UserDocument = {
      _id,
      ...user,
      emailVerified: user.emailVerified ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<UserDocument>(COLLECTIONS.USERS).insertOne(doc);

    return doc;
  },

  async markEmailVerified(id: ObjectId): Promise<void> {
    const db = await connectDB();
    await db
      .collection<UserDocument>(COLLECTIONS.USERS)
      .updateOne(
        { _id: id },
        { $set: { emailVerified: true, updatedAt: new Date() } }
      );
  },

  async updateCredentials(
    id: ObjectId,
    credentials: { password?: string; role?: Role }
  ): Promise<void> {
    const db = await connectDB();
    await db
      .collection<UserDocument>(COLLECTIONS.USERS)
      .updateOne(
        { _id: id },
        { $set: { ...credentials, updatedAt: new Date() } }
      );
  },
};