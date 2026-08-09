import { loadEnv } from "./loadEnv";
import { hashPassword } from "../lib/password";
import { userRepository } from "../repositories/userRepository";
import { toObjectId } from "../utils/ids";
import { ROLES } from "../lib/constants";

/**
 * Creates or updates the admin account from environment variables
 * (ADMIN_EMAIL + ADMIN_PASSWORD). Safe to run repeatedly — upserts by email.
 *
 * Run via: npm run db:admin
 */
async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in the .env file."
    );
  }

  const passwordHash = await hashPassword(password);
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    await userRepository.updateCredentials(toObjectId(existing._id.toString()), {
      password: passwordHash,
      role: ROLES.ADMIN,
    });
    console.log(`Admin updated: ${email}`);
    return;
  }

  await userRepository.create({
    name: "Admin",
    email,
    password: passwordHash,
    role: ROLES.ADMIN,
    emailVerified: true,
  });
  console.log(`Admin created: ${email}`);
}

loadEnv();

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "Admin seed failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  });