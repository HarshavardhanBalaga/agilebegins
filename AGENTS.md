<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agile Begins

Workshop registration platform: student sign-up/booking with UPI payment, confirmation emails, and an admin dashboard (approvals, attendance, CSV export). Next.js 16 App Router + Turbopack, MongoDB native driver, jose JWTs in HTTP-only cookies, nodemailer, Tailwind v4.

## Layout & commands

- The git repo root is `agilebegins/`; the parent `agile-begins/` folder is just a wrapper. Run everything from `agilebegins/`.
- Scripts: `npm run dev` / `build` / `start`, `npm run lint` (ESLint), `npm run typecheck` (`tsc --noEmit`). No test framework — verify with `lint` → `typecheck` → `build`, then smoke-test the auth/registration/admin flows against a running dev server.
- Path alias `@/*` → `./src/*` (used throughout; e.g. `@/lib/...`, `@/middlewares/auth`).
- Root-level `_verify-token.mjs` is a scratch JWT helper, not part of the app.

## Next 16 quirks

- There is NO `middleware.ts` in this version. Routing guard lives in `src/proxy.ts` (`export async function proxy`); it only does an optimistic `/admin` → `/login` redirect. Real auth is always re-verified in each route handler via `requireAuth` / `requireAdmin` (`@/middlewares/auth`) — proxy is never the security boundary, per Next docs.
- Route handlers wrap logic in `run()` from `@/lib/http` (centralized responses / errors). Server-only modules import `"server-only"`.

## Env & DB

- `.env` / `.env.local` are gitignored and not committed, and there is no `.env.example` (README's `cp .env.example .env` is stale). Required keys (from `src/lib/env.ts`): `MONGODB_URI`, `DB_NAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. Optional: `SMTP_SECURE`, `EMAIL_FROM`, `SUPPORT_EMAIL`, `APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `UPI_ID`, `UPI_QR_SRC`, `WORKSHOP_MEETING_LINK`.
- Env access is lazy (`env.ts`): missing vars throw only when the feature using them is called, not at startup. The `db:*` scripts load `.env.local` then `.env` via `process.loadEnvFile` (Node 20.6+ required).
- DB scripts (idempotent, need a running MongoDB): `npm run db:index` (create indexes), `npm run db:seed` (inserts Workshop 001 only when `workshops` is empty), `npm run db:admin` (upsert admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Architecture notes

- `src/lib/constants.ts` is the single source for collection/cookie/role names, TTLs, and rate limits — reuse it instead of literals.
- Two parallel workshop representations: static marketing/brochure content in `src/data/workshops.ts` (different shape, string prices) vs. live MongoDB `workshops` collection seeded by `src/data/seedWorkshops.ts` (`src/types/workshop.ts`). Keep the seed slug/pricing in sync with the brochure data; new events go into MongoDB, not the static file.
- Auth: access + refresh JWTs (jose HS256) in HTTP-only SameSite=Lax cookies; refresh tokens are rotated and stored only as sha-256 hashes. `src/lib/rateLimiter.ts` is in-memory — single-instance only.
- Repo convention: update `PROJECT_PROGRESS.md` after every implemented feature.
