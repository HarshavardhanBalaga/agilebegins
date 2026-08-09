import type { ObjectId } from "mongodb";
import type { TokenPurpose } from "@/lib/constants";

/**
 * A one-time password for password reset, stored in the `otps` collection.
 *
 * Only the sha-256 hash of the code is persisted; `attempts` counts failed
 * verifications so brute force is throttled, and `expiresAt` backs a TTL
 * index so stale rows are removed automatically.
 */
export interface OtpDocument {
  _id: ObjectId;
  userId: ObjectId;
  /** Only TOKEN_PURPOSE.PASSWORD_RESET today; the field keeps future flows honest. */
  purpose: TokenPurpose;
  /** sha-256 hex of the numeric code — the raw code is never stored. */
  codeHash: string;
  /** Number of failed verification attempts against this row. */
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

/** Shape passed to insertOne when creating an OTP. */
export type NewOtp = Omit<OtpDocument, "_id" | "createdAt">;
