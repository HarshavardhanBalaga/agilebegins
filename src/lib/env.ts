import "server-only";

/**
 * Centralised, validated access to environment variables.
 *
 * Importing this module is safe anywhere on the server. Values are lazy so a
 * missing token only fails when the feature that needs it is used, not when
 * unrelated code loads.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Add it to your .env file.`
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name];
}

export const env = {
  mongoUri: () => required("MONGODB_URI"),
  dbName: () => required("DB_NAME"),

  jwt: {
    accessSecret: () => required("JWT_ACCESS_SECRET"),
    refreshSecret: () => required("JWT_REFRESH_SECRET"),
  },

  smtp: () => ({
    host: required("SMTP_HOST"),
    port: Number(required("SMTP_PORT")) || 587,
    secure: String(optional("SMTP_SECURE")) === "true",
    user: required("SMTP_USER"),
    pass: required("SMTP_PASS"),
    from: optional("EMAIL_FROM") ?? "Agile Begins <Workshop@agilebegins.in>",
  }),

  supportEmail: () =>
    optional("SUPPORT_EMAIL") ?? "info@agilebegins.in",

  /** Public WhatsApp community invite shown on student-facing surfaces. */
  whatsappCommunityUrl: () =>
    optional("NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL") ??
    optional("WHATSAPP_COMMUNITY_URL"),

  /**
   * Business/contact details that are still to be confirmed by the owner.
   * These stay `undefined` until they are set, and the About/Contact pages
   * render an explicit "to be confirmed" note instead of an invented value.
   */
  contact: () => ({
    phone: optional("CONTACT_PHONE"),
    address: optional("BUSINESS_ADDRESS"),
    hours: optional("SUPPORT_HOURS"),
    legalEntityName: optional("LEGAL_ENTITY_NAME"),
  }),

  /**
   * Policy decisions that only the business can make (refund windows,
   * governing law, grievance contact). Left `undefined` on purpose so the
   * legal pages flag them rather than inventing terms.
   */
  policy: () => ({
    lastUpdated: optional("POLICY_LAST_UPDATED"),
    refundWindowDays: optional("REFUND_WINDOW_DAYS"),
    governingLaw: optional("GOVERNING_LAW"),
    privacyContact: optional("PRIVACY_CONTACT"),
  }),

  /** Recipient for admin notification emails (new registration alerts). */
  notifyEmail: () =>
    optional("NOTIFY_EMAIL") ?? "info@agilebegins.in",

  admin: () => ({
    email: optional("ADMIN_EMAIL"),
    password: optional("ADMIN_PASSWORD"),
  }),

  upi: () => ({
    id: optional("UPI_ID"),
    qrSrc: optional("UPI_QR_SRC"),
  }),

  appUrl: () =>
    optional("APP_URL") ??
    (process.env.NODE_ENV === "production"
      ? "https://agilebegins.in"
      : "http://localhost:3000"),

  isProduction: () => process.env.NODE_ENV === "production",
} as const;