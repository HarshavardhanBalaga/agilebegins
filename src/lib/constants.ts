export const COLLECTIONS = {
  USERS: "users",
  WORKSHOPS: "workshops",
  REGISTRATIONS: "registrations",
  REFRESH_TOKENS: "refreshTokens",
  OTPS: "otps",
  MATCH_QUEUE: "match_queue",
  STUDY_ROOMS: "study_rooms",
  MATCH_INVITES: "match_invites",
  ROOM_MESSAGES: "room_messages",
  ROOM_TASKS: "room_tasks",
  ROOM_REPORTS: "room_reports",
  ROOM_BLOCKS: "room_blocks",
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
  MATCH_JOIN: { limit: 10, windowMs: 60_000 },
  MATCH_STATUS: { limit: 60, windowMs: 60_000 },
  MATCH_ROOM: { limit: 60, windowMs: 60_000 },
  MATCH_CANCEL: { limit: 20, windowMs: 60_000 },
  MATCH_LEAVE: { limit: 20, windowMs: 60_000 },
  MATCH_INVITE: { limit: 20, windowMs: 60_000 },
  MATCH_INVITES: { limit: 60, windowMs: 60_000 },
  MATCH_RESPOND: { limit: 20, windowMs: 60_000 },
  /** Generous IP bucket applied before auth on match routes (unauthenticated abuse). */
  MATCH_IP: { limit: 120, windowMs: 60_000 },
} as const;

export const RATE_LIMIT_SCOPE = {
  AUTH: "auth",
  REGISTER: "register",
  EMAIL: "email",
  MATCH_JOIN: "match:join",
  MATCH_STATUS: "match:status",
  MATCH_ROOM: "match:room",
  MATCH_CANCEL: "match:cancel",
  MATCH_LEAVE: "match:leave",
  MATCH_INVITE: "match:invite",
  MATCH_INVITES: "match:invites",
  MATCH_RESPOND: "match:respond",
  MATCH_IP: "match:ip",
} as const;

/** Companion matching queue/room lifecycle tuning. */
export const MATCH_QUEUE_STATUS = {
  WAITING: "waiting",
  CLAIMED: "claimed",
} as const;

export type MatchQueueStatus =
  (typeof MATCH_QUEUE_STATUS)[keyof typeof MATCH_QUEUE_STATUS];

export const STUDY_ROOM_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const;

export type StudyRoomStatus =
  (typeof STUDY_ROOM_STATUS)[keyof typeof STUDY_ROOM_STATUS];

/** Sliding heartbeat TTL for `match_queue.expiresAt` (refreshed on join/status). */
export const MATCH_QUEUE_TTL_MS = 5 * 60 * 1000;

/** Invite lifespan: an unanswered pick-from-list invite expires after 2 minutes. */
export const MATCH_INVITE_TTL_MS = 2 * 60 * 1000;

/** Cap on directory rows returned by `GET /api/match/available`. */
export const MATCH_AVAILABLE_LIMIT = 20;

export const MATCH_INVITE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export type MatchInviteStatus =
  (typeof MATCH_INVITE_STATUS)[keyof typeof MATCH_INVITE_STATUS];

/** Co-study room MVP tuning. All room state polls on the same 3s cadence as v1 matching. */
export const ROOM_POLL_MS = 3000;

/** Presence options a member can set for themselves. */
export const ROOM_PRESENCE = {
  STUDYING: "studying",
  BREAK: "break",
  AWAY: "away",
} as const;

export type RoomPresence =
  (typeof ROOM_PRESENCE)[keyof typeof ROOM_PRESENCE];

/** A member counts as "online" when their heartbeat is fresher than this. */
export const ROOM_ONLINE_MS = 30 * 1000;

/** Heartbeat throttle: client sends at most one heartbeat per interval. */
export const ROOM_HEARTBEAT_MS = 15 * 1000;

/** Shared timer phases. `idle` = not started yet. */
export const ROOM_TIMER_PHASE = {
  IDLE: "idle",
  FOCUS: "focus",
  BREAK: "break",
} as const;

export type RoomTimerPhase =
  (typeof ROOM_TIMER_PHASE)[keyof typeof ROOM_TIMER_PHASE];

/** Shared timer running state within a phase. */
export const ROOM_TIMER_STATE = {
  STOPPED: "stopped",
  RUNNING: "running",
  PAUSED: "paused",
} as const;

export type RoomTimerState =
  (typeof ROOM_TIMER_STATE)[keyof typeof ROOM_TIMER_STATE];

/** Default focus/break lengths (seconds). */
export const ROOM_FOCUS_SECONDS = 25 * 60;
export const ROOM_BREAK_SECONDS = 5 * 60;

/** Min/max focus/break lengths accepted by the timer action (seconds). */
export const ROOM_TIMER_MIN_SECONDS = 60;
export const ROOM_TIMER_MAX_SECONDS = 4 * 60 * 60;

/** Caps for lightweight room content. */
export const ROOM_GOAL_MAX_LENGTH = 140;
export const ROOM_TASK_MAX_LENGTH = 120;
export const ROOM_TASKS_MAX = 20;
export const ROOM_MESSAGE_MAX_LENGTH = 500;
export const ROOM_MESSAGES_LIMIT = 50;
export const ROOM_REPORT_MAX_LENGTH = 500;

/** localStorage key for the study room's first-visit side-tab cues (per browser). */
export const ROOM_SIDES_HINT_STORAGE_KEY = "agilebegins.room.sidesHint";
