export const COLLECTIONS = {
  USERS: "users",
  WORKSHOPS: "workshops",
  REGISTRATIONS: "registrations",
  REFRESH_TOKENS: "refreshTokens",
  OTPS: "otps",
} as const;

export const COOKIE_NAMES = {
  ACCESS: "access_token",
  REFRESH: "refresh_token",
} as const;

export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PAYMENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const DEFAULT_TTL_MS = {
  ACCESS: 15 * 60 * 1000, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 10 * 60 * 1000, // 10 minutes
} as const;

export const PASSWORD_HASH_ROUNDS = 10;

export const MEETING_LINK_ENV = "WORKSHOP_MEETING_LINK";

export const MAX_TXN_ID_LENGTH = 64;

export const OTP = {
  LENGTH: 4,
  TTL_MS: 10 * 60 * 1000,
  MAX_ATTEMPTS: 5,
  RESEND_MS: 60 * 1000,
} as const;

/** JWT purposes used to scope short-lived single-use tokens. */
export const TOKEN_PURPOSE = {
  EMAIL_VERIFY: "email_verify",
  PASSWORD_RESET: "password_reset",
} as const;

export type TokenPurpose = (typeof TOKEN_PURPOSE)[keyof typeof TOKEN_PURPOSE];

export const RATE_LIMITS = {
  AUTH: { limit: 10, windowMs: 60_000 },
  REGISTER: { limit: 5, windowMs: 10 * 60_000 },
  EMAIL: { limit: 5, windowMs: 10 * 60_000 },
} as const;

export const RATE_LIMIT_SCOPE = {
  AUTH: "auth",
  REGISTER: "register",
  EMAIL: "email",
} as const;