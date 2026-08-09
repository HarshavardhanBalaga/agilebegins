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
- ✅ `POST /api/register` (auth required, duplicate txn/registration prevention, optional screenshot)
- ✅ `/register` page + `RegistrationFlow` (auth → details → UPI → success)
- ✅ UPI payment section (QR, UPI ID, amount, txn id, screenshot)
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
- ⬜ Verify against a real SMTP provider once credentials are added to `.env`

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
- ⬜ `npm run lint`
- ⬜ `npm run typecheck`
- ⬜ `npm run build`
- ⬜ `npm run db:index` then `npm run db:admin`
- ⬜ Smoke-test auth + registration + admin flows against running dev server