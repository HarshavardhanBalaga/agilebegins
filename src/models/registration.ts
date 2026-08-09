import type { ObjectId } from "mongodb";
import type { PaymentStatus } from "@/lib/constants";

/**
 * A registration exactly as stored in the `registrations` collection.
 *
 * `screenshot` is an optional base64 data URL of the manual UPI payment
 * screenshot uploaded by the student.
 */
export interface RegistrationDocument {
  _id: ObjectId;
  userId: ObjectId;
  workshopId: ObjectId;
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  transactionId: string;
  screenshot: string | null;
  paymentStatus: PaymentStatus;
  confirmationMailSent: boolean;
  meetingLinkSent: boolean;
  attendance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape passed to insertOne when creating a registration. */
export type NewRegistration = Omit<
  RegistrationDocument,
  "_id" | "createdAt" | "updatedAt"
>;

/**
 * Admin-facing serialized registration, augmented with the workshop title,
 * the student's email-verification status and a reference-safe string id set.
 */
export interface RegistrationView {
  _id: string;
  userId: string;
  workshopId: string;
  workshopTitle: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  year: string;
  transactionId: string;
  paymentStatus: PaymentStatus;
  /** Whether the linked account verified its email (legacy accounts count as verified). */
  emailVerified: boolean;
  confirmationMailSent: boolean;
  meetingLinkSent: boolean;
  attendance: boolean;
  createdAt: string;
  hasScreenshot: boolean;
}

/**
 * Full admin-facing registration detail: every list field plus the payment
 * screenshot (base64) and the last update timestamp, used by the detail
 * drawer and screenshot lightbox.
 */
export interface RegistrationDetail extends RegistrationView {
  screenshot: string | null;
  updatedAt: string;
}

/** Filters accepted by the admin registration list endpoint. */
export interface RegistrationFilters {
  workshopId?: string;
  status?: PaymentStatus;
  search?: string;
}