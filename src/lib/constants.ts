export const COLLECTIONS = {
  USERS: "users",
  WORKSHOPS: "workshops",
  REGISTRATIONS: "registrations",
  REFRESH_TOKENS: "refreshTokens",
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
} as const;

export const PASSWORD_HASH_ROUNDS = 10;

export const MEETING_LINK_ENV = "WORKSHOP_MEETING_LINK";

export const MAX_TXN_ID_LENGTH = 64;

export const RATE_LIMITS = {
  AUTH: { limit: 10, windowMs: 60_000 },
  REGISTER: { limit: 5, windowMs: 10 * 60_000 },
} as const;

export const RATE_LIMIT_SCOPE = {
  AUTH: "auth",
  REGISTER: "register",
} as const;