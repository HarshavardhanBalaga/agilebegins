# Agile Begins — Project Progress Tracker

> Maintained by the Lead Engineer. Updated after EVERY implemented feature.

Legend: ✅ Done · 🔄 In progress · ⬜ Pending

---

## 1. Dependencies & Tooling
- ✅ Installed `bcryptjs` (password hashing), `jose` (JWT), `nodemailer` (email), `tsx` (script runner)
- ✅ Added npm scripts: `typecheck`, `db:seed`, `db:index`, `db:admin`

## 2. Core Library (`src/lib`)
- ✅ `env.ts` — validated, lazy env access
- ✅ `constants.ts` — collections, cookies, roles, TTLs, rate limits
- ✅ `tokens.ts` — jose access/refresh JWT sign+verify, refresh-token hashing
- ✅ `session.ts` — HTTP-only Secure SameSite=Lax cookie attach/clear
- ✅ `password.ts` — bcrypt hash/verify
- ✅ `http.ts` — centralized responses, AppError, no stack leaks
- ✅ `rateLimiter.ts` — in-memory sliding-window rate limiting
- ✅ `sanitize.ts` — trim, strip HTML, CSV formula-injection guard
- ✅ `nodemailer.ts` — SMTP transport singleton
- ✅ `mongodb.ts` — existing singleton connection (unchanged)

## 3. Data Layer
- ✅ Models: `user`, `registration`, `refreshToken`
- ✅ Repositories: `user`, `refreshToken`, `registration`, `workshop`
- ✅ `ensureIndexes()` — unique email / unique (user+workshop) / unique txn-id / token TTL
- ✅ Workshop types (existing) reused from `src/types/workshop.ts`

## 4. Services, Validators & Guards
- ✅ `authService` — register, login, refresh rotation, logout
- ✅ `registrationService` — create (dup-safe), verify, reject, resend email, attendance, export
- ✅ `emailService` — confirmation email (date, time, platform, meeting link, support email)
- ✅ Validators (zod): `auth`, `registration`
- ✅ `middlewares/auth.ts` — `requireAuth`, `requireAdmin`
- ✅ `middlewares/rateLimit.ts`

## 5. Auth API
- ✅ `POST /api/auth/register`
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/logout`
- ✅ `POST /api/auth/refresh` (rotates refresh tokens)
- ✅ `GET /api/auth/me`

## 6. Registration & Payments
- ✅ `POST /api/register` (auth required, duplicate txn/registration prevention, optional txn id, optional screenshot)
- ✅ `/register` page + `RegistrationFlow` (auth → details → UPI → success)
- ✅ UPI payment section (QR, UPI ID, amount, optional txn id, screenshot)
- ✅ Success screen + WhatsApp Community CTA

## 7. Admin
- ✅ `src/proxy.ts` — Next 16 proxy guarding `/admin/*` (optimistic; real auth in routes)
- ✅ `/login` page + `AuthForm` used across auth surfaces
- ✅ `GET /api/admin/registrations` (+ `?format=csv`)
- ✅ `GET /api/admin/registrations/[id]` (screenshot view)
- ✅ `POST /api/admin/verify` (verify + send confirmation email)
- ✅ `POST /api/admin/reject`
- ✅ `POST /api/admin/send-confirmation`
- ✅ `POST /api/admin/attendance`
- ✅ `/admin` dashboard — stats, table, actions, screenshot modal, CSV export

## 8. Email (nodemailer / SMTP)
- ✅ `src/lib/nodemailer.ts` transport
- ✅ Confirmation email template (workshop date · time · platform · meeting link · support email)
- ✅ Best-effort dispatch; admin can resend if SMTP fails
- ⬜ Verify against a real SMTP provider once `SMTP_*` credentials are added to `.env`

## 9. Security
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Tokens in HTTP-only Secure SameSite=Lax cookies (never localStorage)
- ✅ Refresh-token rotation + revocation + hashed storage; TTL auto-clean
- ✅ Rate limiting on auth + registration endpoints
- ✅ Duplicate registration (unique userId+workshopId) and duplicate transaction id guards
- ✅ Admin routes double-guarded (proxy + `requireAdmin` + DB check)
- ✅ Input sanitization (strip tags, trim, CSV injection guard)
- ⬜ Env secrets to be filled: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_*`, `ADMIN_EMAIL/PASSWORD`, `UPI` values

## 9. Verification & Smoke Tests
- ✅ `npm run lint`
- ✅ `npm run typecheck`
- ✅ `npm run build`
- ✅ `npm run db:index` — all indexes created on Atlas (`agilebegins` db)
- ✅ `npm run db:seed` — Workshop 001 already present (LIVE, ₹49, slug `workshop-001`); script skips non-empty collections
- ✅ `npm run db:admin` — admin upserted (`admin@agilebegins.com`)
- ✅ Smoke-tested against running dev server + Atlas:
  - register / login / logout / refresh rotation (old refresh token rejected after use) ✅
  - `/api/auth/me` (401 logged-out, 200 logged-in) ✅
  - `/api/workshops` + `/api/workshops/[slug]` ✅
  - `POST /api/register` → 201 pending; duplicate-txn & duplicate user+workshop → 409; email-must-match-account → 400 ✅
  - `/api/admin/registrations` list + counts; student → 403; `[id]` detail; `?format=csv` ✅
  - `POST /api/admin/verify` / `reject` / `send-confirmation` / `attendance` ✅
  - `src/proxy.ts` redirects `/admin` → `/login?next=/admin` when unauthenticated ✅
  - Test data cleaned up afterwards (2 test users + 2 registrations removed)

## 10. Env & Client Session Resilience
- ✅ `.env.example` created (all keys documented; `.gitignore` updated with `!.env.example`)
- ✅ `.env` populated with real Atlas credentials, JWT secrets, admin bootstrap
- ⚠️ `DB_NAME=local` does NOT work — `local` is a MongoDB system database and Atlas rejects writes (`not authorized on local`). Changed to `DB_NAME=agilebegins`.
- ✅ WhatsApp/UPI keys reconciled with the client: `NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL`, `NEXT_PUBLIC_UPI_ID`, `NEXT_PUBLIC_UPI_QR_SRC` (read by `RegistrationFlow`)
- ✅ `src/lib/clientFetch.ts` — client fetch wrapper that auto-refreshes the access token on 401 (shared single refresh) and retries; wired into `RegistrationFlow`, `AdminDashboard`, `ScreenshotModal`
- ✅ Consolidated duplicate access-token verifier in `src/lib/tokens.ts` (removed `verifyAccessTokenSignature`)

## 11. Email Honesty Fix
- ✅ `emailService` now uses throwing `sendEmail` instead of `sendEmailSafe`, so `confirmationEmailSent` is only `true` when SMTP actually delivered
- ✅ Removed the now-unused `sendEmailSafe` from `src/lib/nodemailer.ts`
- ✅ Admin verify/send-confirmation now report `confirmationEmailSent: false` with a retry hint when SMTP is unconfigured (was falsely claiming "sent")
- ⬜ Configure `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` in `.env` to enable real confirmation emails

## 12. Duplicate-Registration Friendly Screen + SSR Refactor
- ✅ Duplicate `POST /api/register` now returns `409` with `code: "ALREADY_REGISTERED"` (`httpError.conflict`, `AppError.code` carried into `toErrorBody`)
- ✅ `RegistrationFlow` shows a friendly "You're already in!" success screen (same layout as success, WhatsApp Community CTA) instead of a bare error on duplicate registration
- ✅ Refactored `/register`, `/admin`, `/login` to SSR-first: session + data resolved on the server, interactive components (`RegistrationFlow`, `AdminDashboard`, `LoginPanel`) receive plain serializable props
- ✅ `middlewares/auth.ts` gained `getSessionUser()` (server-component session lookup via `await cookies()`)
- ✅ `workshopRepository.listPublic()` added and `GET /api/workshops` simplified to use it
- ✅ `canRefresh` on `/register` — when the access token expired but a refresh cookie exists, the client silently refreshes once and jumps to the details step
- ✅ `/admin` redirects non-admins to `/login?next=/admin`; `/login` redirects already-signed-in admins to `?next=` (non-admins go home to avoid an `/admin`↔`/login` loop)
- ✅ `LoginClient.tsx` replaced by slim `LoginPanel.tsx`; `ScreenshotModal`/`AdminDashboard` unchanged visually
- ✅ Already-registered users no longer redo the form: `/register` (SSR) checks `findByUserAndWorkshop` for the resolved workshop and renders the "You're already in!" screen immediately; expired-access-with-valid-refresh reloads once after the silent refresh so SSR detects it correctly
- ✅ Verified: `lint`, `typecheck`, `build` pass; smoke-tested SSR pages + duplicate-registration 409 flow; test data cleaned up afterwards

## 13. Public Browsing + Navbar Auth (login only when needed)
- ✅ Home/workshop browsing stays fully public — no login gate on the landing pages
- ✅ Navbar gained `AuthLinks` (desktop + mobile): shows "Log in" / "Register" when signed out, and the user's name + "Log out" (plus a "Dashboard" link for admins) when signed in; session is fetched client-side via `/api/auth/me`
- ✅ One account unlocks everything: access/refresh cookies persist (refresh TTL 7 days), so registering for additional workshops needs no re-login; login is only prompted where an action requires it (`/register`, `/admin`)
- ✅ "Reserve Your Seat" CTAs (navbar + home Hero) now point directly to `/register` so they work from the home page too
- ✅ Navbar reacts to auth changes live: `src/lib/authEvents.ts` broadcasts an `auth:changed` event on login/register/logout (from `AuthForm`, `AdminShell`), and the Navbar subscribes and re-fetches `/api/auth/me` — so logging in inside the `/register` flow updates the navbar without a page reload
- ✅ Registration dropdown shows only active (LIVE) workshops: `/register` (SSR) filters to `liveWorkshops`, resolves the default from them, and the `?workshop=<slug>` deep link pre-selects the clicked workshop (`WorkshopHero` + `FinalCta` now deep-link); Coming Soon workshops are excluded from the dropdown
- ✅ Server-side hardening: `registrationService.create` rejects non-LIVE workshops with a friendly 400 (`"This workshop isn't open for registration yet."`)
- ✅ Verified: `lint`, `typecheck`, `build` pass; home/workshop/admin pages render 200 with no dev-log errors

## 13. Production-Grade Admin Dashboard (per-workshop + full detail)
- ✅ `registrationRepository.listViews` now accepts `workshopId` / `status` / `search` filters; `total` respects `status`, `counts` are scoped to workshop+search (so status tabs always show real availability)
- ✅ `registrationRepository.countByWorkshop()` — per-workshop total/pending/verified/rejected/attended breakdown for the tab bar
- ✅ `registrationRepository.findViewDetail()` — full detail (view fields + screenshot + updatedAt) for the drawer
- ✅ `registrationService.listForAdmin(page, pageSize, filters)`, `adminSummary()` (joins catalog + counts, zeroed for empty workshops), `detailById()`
- ✅ New `GET /api/admin/workshops` — admin-only workshop tab-bar summary
- ✅ `GET /api/admin/registrations` now parses `workshopId`/`status`/`search`; `?format=csv` respects the active filters
- ✅ `GET /api/admin/registrations/[id]` returns the full detail shape
- ✅ New compound index `registrations { workshopId, paymentStatus }` created via `db:index`
- ✅ `/admin` SSR now preloads workshop summary + first page (Promise.all) and passes both to the client dashboard
- ✅ `AdminDashboard` refactor: horizontal workshop tabs ("All workshops" + per-workshop totals), status filter pills with counts, debounced (300ms) search, filtered CSV export link, row-click detail drawer
- ✅ `RegistrationsTable` rows are clickable (opens drawer); inline action buttons stop propagation
- ✅ New `RegistrationDrawer` — slide-in panel with full student record, email/attendance flags, payment screenshot, lifecycle timeline, and inline verify/reject/send-email/attendance actions
- ✅ New `StatusTimeline` — stepper: Registered → Payment Verified/Rejected → Confirmation Email → Attended (done/current/failed/skipped states)
- ✅ New `WorkshopTabs` — horizontal scrollable pill selector
- ✅ Verified: `lint`, `typecheck`, `build` pass; smoke-tested auth guard (401), admin login, workshops summary, list + all filters, full detail, CSV export against dev server; index created on Atlas

## 14. Admin Routing UI (sidebar shell + routed pages)
- ✅ New `src/app/admin/layout.tsx` — server layout re-enforces admin auth (redirects to `/login?next=/admin`) and wraps every admin page in `AdminShell`
- ✅ New `src/components/admin/AdminShell.tsx` — client sidebar shell (fixed left sidebar on desktop, top bar on mobile) with Dashboard / Registrations / Workshops nav, active-route highlighting (`usePathname`), admin identity, "View site" link and logout
- ✅ `/admin` — Dashboard overview: KPI cards (total/pending/verified/rejected/attended), per-workshop cards linking to filtered registrations, recent-registrations list
- ✅ `/admin/registrations` — the full registrations manager moved here (workshop tabs, status filter, search, drawer); supports `?workshop=<id>` deep link to pre-select a workshop
- ✅ `/admin/workshops` — workshop catalog with per-workshop registration breakdown, linking to the registrations manager filtered by that workshop
- ✅ `AdminDashboard` slimmed: removed duplicate logout / signed-in line (now in shell); accepts `initialWorkshopId` prop
- ✅ `src/proxy.ts` now preserves the original admin path + query in the login `?next=` (e.g. `/admin/registrations?workshop=…`), so admins land exactly where they tried to go
- ✅ Verified: `lint`, `typecheck`, `build` pass; smoke-tested sidebar shell + all three routes, deep-link redirect (307 → `/login?next=%2Fadmin%2Fregistrations…`), login → dashboard, workshops → filtered registrations

## 15. Email Automation (verification · per-workshop emails · forgot-password OTP)
- ✅ Email verification (Phase 1):
  - `UserDocument.emailVerified` + `isEmailVerified()` (existing accounts / admins treated as verified); `toPublicUser` exposes it
  - `signPurposeToken`/`verifyPurposeToken` in `tokens.ts` — short-lived single-purpose JWTs (email_verify 24h, password_reset 10m)
  - `dispatchVerificationEmail()` + `verifyEmail()` + `resendVerification()` in `authService`; register creates accounts `emailVerified:false`, best-effort verify email
  - `POST /api/auth/resend-verification` (rate-limited `RATE_LIMIT_SCOPE.EMAIL`); `POST /api/register` returns `403 EMAIL_NOT_VERIFIED` for unverified students
  - `/verify-email` SSR page (token verified server-side) with resend control; `RegistrationFlow` gained a "verify your email" step (initial + post-auth + 403 branch)
- ✅ Per-workshop post-payment emails + acknowledgement (Phase 2):
  - `WorkshopDocument` optional `meetingLink` / `whatsappLink` / `emailSubject` / `emailBody`; `workshopRepository.updateEmailSettings(id, set)`
  - `emailService.sendAcknowledgementEmail` on registration submit (best-effort); confirmation email now uses per-workshop subject/body/meeting/WhatsApp with env fallbacks
  - `POST /api/admin/workshops/mail-settings` — admin save or "send test email" preview (uses entered, unsaved values; friendly 502 on SMTP failure)
  - `/admin/workshops/[id]/mail-settings` SSR page + `MailSettingsForm`; "Mail settings" link on each workshop card
- ✅ Forgot password via 4-digit OTP (Phase 3):
  - `otps` collection: hashed code (sha-256), `attempts` budget (max 5), 10-min TTL; `otpRepository`, `passwordResetService`
  - `POST /api/auth/forgot-password` — generic response (no account enumeration); `POST /api/auth/reset-password` — verifies code, resets password, invalidates OTPs
  - `/forgot-password` SSR page + `ForgotPasswordForm` (request → reset → done); "Forgot password?" link in `AuthForm`
- ✅ Indexes: `users.emailVerified`, `otps.expiresAt` (TTL), `otps { userId, purpose }` — applied via `db:index`
- ✅ Verified: `lint`, `typecheck`, `build` pass; smoke-tested register→verify-link→`emailVerified:true`→workshop register (201), unverified register blocked (403 EMAIL_NOT_VERIFIED), OTP wrong-code (400) / correct-code reset + login with new password, admin mail-settings save + clear (persistence verified), forgot-password generic response; test data cleaned up afterwards

## 16. Live Email Delivery (Gmail App Password)
- ✅ `.env` SMTP configured: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=agilebegins@gmail.com`, `SMTP_PASS=<app password>`, `EMAIL_FROM` matched to the sender account
- ✅ Verified transport connects: `transporter.verify()` → OK against Gmail
- ✅ Restarted dev server (nodemailer transport is cached per process; also cleared a corrupted `.next` from a force-kill)
- ✅ Real delivery smoke-tested end-to-end (all 200, no SMTP errors in log):
  - Admin "Send test email" (confirmation template) ✅
  - Verification email on register + resend-verification ✅
  - Password-reset OTP email via forgot-password ✅
  - Acknowledgement email on registration submit (best-effort) ✅
  - Confirmation email on admin verify → `confirmationEmailSent: true` ✅
- ✅ Test data cleaned up afterwards (3 test users, 1 registration, 1 OTP)

## 17. Admin Workflow Tightening + Student-Side Validation
- ✅ Confirmation "Send Email" is now **verified-only**: hidden in the table + drawer for pending/rejected, and the API (`resendConfirmation`) returns `409` unless `paymentStatus === verified` — a rejected registration can never send email
- ✅ Admin panel now shows the student's **email-verification status**: badge under the Email column in the registrations table, an "Email verified" flag in the detail drawer, and an "Email Verified" (Yes/No) column in CSV export — derived via a `users` `$lookup` (legacy accounts without the field count as verified)
- ⬜ ~~Gmail-only registration~~ **removed on request** — any valid email is accepted again (reverted the `registerSchema` rule and the AuthForm Gmail hint/placeholder).
- ✅ **Indian mobile validation**: phone is normalized (spaces/hyphens stripped, optional `+91`) and must match `/^(\+91)?[6-9]\d{9}$/`; RegistrationFlow shows an inline hint. Stored value is normalized (e.g. `+91 98765 43210` → `+919876543210`).
- ✅ **Unified auth wording/order**: AuthForm tabs are now "Log in" / "Register" (same order + wording as the navbar; "Login"→"Log in")
- ✅ (Already enforced, smoke-verified) duplicate same-email + same-workshop → `409 ALREADY_REGISTERED`; returning students land directly on the "You're already in!" WhatsApp-community screen
- ✅ Verified: `lint`, `typecheck`, `build` pass; smoke-tested reject→send-email (409), verify→send-email (true), email-verified badge/list/detail/CSV, gmail-only register (yahoo 400 / gmail 200), bad phone (400) / `+91 98765 43210` (201, normalized), duplicate (409); test data cleaned up afterwards

## 18. Form Readability Pass
- ✅ Raised contrast of form text in the register flow so it reads clearly on the brand indigo background: input placeholders `white/40` → `white/60`, AuthForm field labels `white/60` → `white/80`, RegistrationFlow field labels `white/80` → `white/90`, phone helper text `white/40` → `white/60`
- ✅ Verified: `lint` pass, `typecheck` pass (after moving a corrupt mid-write `.next/dev/types/validator.ts` aside — regenerates on the next dev compile)
- ✅ Register page centered on desktop: heading block `lg:mx-auto lg:text-center`, flow container `mx-auto` (all steps — auth, details, payment, success)
- ✅ `required` attribute added to every form field across the register flow: AuthForm (name/email/password/confirm) + details step (workshop/name/email/phone/college/branch/year) + payment step (transaction id). The payment screenshot stays optional (labeled so).

## 19. Favicon (logo.png from public/icons)
- ✅ Root cause: `public/icons/logo.png` was never referenced — the layout's `metadata` had no `icons`, and Next auto-detected `src/app/favicon.ico`, which was serving as the tab icon (and the browser had an old cached one)
- ✅ Added `icons: { icon: "/icons/logo.png" }` to `metadata` in `src/app/layout.tsx` and removed `src/app/favicon.ico` so it can't emit a competing `rel="icon"` link
- ✅ Verified: rendered HTML now emits exactly `<link rel="icon" href="/icons/logo.png"/>`; `/icons/logo.png` returns 200 `image/png`; `lint` + `typecheck` pass
- ⚠️ `logo.png` is 1254×1254 (917 KB) — heavy for a browser-tab favicon; consider generating small optimized copies later

## 20. Post-Login Redirect to /workshop
- ✅ After login/register, non-admin users go straight to `/workshop` (workshop catalog) instead of `/register` (workshop registration flow)
- ✅ `LoginPanel` success handler routes non-admins to `/workshop`; `login/page.tsx` SSR redirect for already-signed-in users maps non-admins to `/workshop`
- ✅ Verified: `lint` + `typecheck` pass

## 21. Professional Email Templates (brand-aligned)
- ✅ All four HTML emails (verification, confirmation, acknowledgement, OTP) rebuilt on a shared `emailShell` in `src/services/emailService.ts` — consistent header, lime accent strip, soft footer
- ✅ Exact site brand palette from `globals.css`: indigo `#2f1bff` header / links, lime `#d6ff00` accent + CTA buttons (with ink text), ink `#111111` headings, soft neutral surfaces for readable body copy
- ✅ Email-client-safe code: table-based layout, inline styles, padded CTA buttons, fallback link text, `mso-padding-alt` for Outlook
- ✅ Added building blocks: `detailRows` (workshop info cards), `noteBlock` (tips), `button` (lime accent / indigo brand variants), `supportFooter`, eyebrow + title hierarchy
- ✅ Plain-text counterparts unchanged; `lint`, `typecheck`, `build` all pass

## 22. New-Registration Alert to info@agilebegins.in
- ✅ `emailService.sendNewRegistrationNotification` — sends basic student details (name, email, phone, college, branch, year, transaction ID) + workshop (title, date, time) to `env.notifyEmail()` (default `info@agilebegins.in`, override via `NOTIFY_EMAIL`) whenever a registration is submitted; no payment screenshot in the email
- ✅ HTML + plain-text templates reuse the shared `emailShell`/`detailRows`/`noteBlock` building blocks
- ✅ Wired into `registrationService.create` as best-effort (SMTP failure never blocks the registration), alongside the existing acknowledgement email
- ✅ Verified: `lint` + `typecheck` pass