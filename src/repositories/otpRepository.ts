import { connectDB } from "@/lib/mongodb";
import { COLLECTIONS, type TokenPurpose } from "@/lib/constants";
import { OTP } from "@/lib/constants";
import type { OtpDocument, NewOtp } from "@/models/otp";
import { ObjectId } from "mongodb";

/**
 * Data access for the `otps` collection (one-time passwords for password
 * reset). No business rules live here.
 */
export const otpRepository = {
  /**
   * Stores a new OTP hash. Previous rows for the same user + purpose are
   * left to the TTL index — issuing a new code supersedes the old one by
   * verification logic, not by deletion.
   */
  async create(otp: NewOtp): Promise<OtpDocument> {
    const db = await connectDB();
    const _id = new ObjectId();
    const doc: OtpDocument = {
      _id,
      ...otp,
      createdAt: new Date(),
    };
    await db.collection<OtpDocument>(COLLECTIONS.OTPS).insertOne(doc);
    return doc;
  },

  /**
   * The most recently issued OTP for a user + purpose that is still within
   * its window and has not exhausted its attempt budget.
   */
  async findActive(
    userId: ObjectId,
    purpose: TokenPurpose
  ): Promise<OtpDocument | null> {
    const db = await connectDB();
    return db
      .collection<OtpDocument>(COLLECTIONS.OTPS)
      .findOne(
        {
          userId,
          purpose,
          attempts: { $lt: OTP.MAX_ATTEMPTS },
          expiresAt: { $gt: new Date() },
        },
        { sort: { createdAt: -1 } }
      );
  },

  /** Records a failed verification attempt on a specific OTP row. */
  async incrementAttempts(id: ObjectId): Promise<void> {
    const db = await connectDB();
    await db
      .collection<OtpDocument>(COLLECTIONS.OTPS)
      .updateOne({ _id: id }, { $inc: { attempts: 1 } });
  },

  /** Deletes every OTP for a user + purpose (called after a successful reset). */
  async invalidateAll(userId: ObjectId, purpose: TokenPurpose): Promise<void> {
    const db = await connectDB();
    await db
      .collection<OtpDocument>(COLLECTIONS.OTPS)
      .deleteMany({ userId, purpose });
  },
};
