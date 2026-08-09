# Agile Begins

Workshop registration platform: student sign-up/booking flow, UPI payment
verification, confirmation emails, and an admin dashboard for approvals,
attendance and CSV export.

Built with Next.js 16 (App Router + Turbopack), MongoDB (native driver),
jose (JWT in HTTP-only cookies), nodemailer, and Tailwind CSS v4.

## Getting started

Prerequisites: Node 20.6+ (uses `--env-file`) and a MongoDB database
(Atlas works).

```bash
npm install
cp .env.example .env   # then fill in your values
npm run db:index        # create indexes
npm run db:seed         # seed Workshop 001 (only when empty)
npm run db:admin        # create/update the admin account
npm run dev             # http://localhost:3000
```

Env vars are read from `.env` by both Next.js and the `db:*` scripts. See
`.env.example` for every key and its purpose.

## Scripts

| Script            | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Next.js dev server                             |
| `npm run build`   | Production build                               |
| `npm run start`   | Production server                              |
| `npm run lint`    | ESLint                                         |
| `npm run typecheck` | `tsc --noEmit`                             |
| `npm run db:seed` | Seed Workshop 001 into MongoDB (idempotent)    |
| `npm run db:index`| Create all database indexes                    |
| `npm run db:admin`| Upsert the admin account from `ADMIN_*` env    |

## Architecture

```
src/
  app/          routes (pages + /api/* route handlers)
  components/   landing, workshop brochure, register flow, admin
  lib/          mongodb, env, http helpers, jwt/tokens, session cookies, rate limiter, nodemailer
  models/       MongoDB document shapes
  repositories/ data access (users, workshops, registrations, refreshTokens)
  services/     business rules: auth, registrations, email
  validators/   zod schemas shared by API and forms
  middlewares/  requireAuth/requireAdmin + rate limiting
  scripts/      seed/index/admin CLI tools
  proxy.ts      optimistic guard that redirects /admin to /login
```

### Auth

- Access + refresh JWTs (jose HS256) live in HTTP-only `SameSite=Lax`
  cookies; refresh tokens are rotated and stored only as sha-256 hashes.
- `requireAuth` / `requireAdmin` re-verify the token and load the user from
  the DB on every protected route (the proxy is only an optimistic redirect).

### Registration flow

1. Student signs up/logs in on `/register`.
2. Enters workshop + student details, then UPI payment info (txn ID + optional screenshot).
3. `POST /api/register` stores a `pending` registration (duplicate txn /
   workshop guarded).
4. Admin verifies on `/admin` → confirmation email is sent (best-effort;
   can be re-sent from the dashboard).

## Verification

`npm run lint`, `npm run typecheck`, `npm run build`, then seed + smoke-test
against a running dev server.

> Email sending is best-effort until real SMTP credentials are set in `.env`.
> The admin dashboard surfaces "Send Confirmation Email" to retry on failure.