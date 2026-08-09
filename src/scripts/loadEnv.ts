/**
 * Loads .env.local (falling back to .env) before a script runs. Mirrors the
 * existing seedWorkshops.ts behavior so `npm run db:*` scripts see the same
 * environment the Next.js server does.
 */
export function loadEnv(): void {
  if (process.env.MONGODB_URI && process.env.DB_NAME) return;
  try {
    process.loadEnvFile(".env.local");
  } catch {
    process.loadEnvFile(".env");
  }
}