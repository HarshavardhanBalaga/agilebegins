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
    await db
      .collection<UserDocument>(COLLECTIONS.USERS)
      .insertOne({ _id, ...user, createdAt: now, updatedAt: now });

    return { _id, ...user, createdAt: now, updatedAt: now };
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