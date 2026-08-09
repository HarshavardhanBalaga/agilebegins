import bcrypt from "bcryptjs";
import { PASSWORD_HASH_ROUNDS } from "@/lib/constants";

/**
 * Password hashing via bcrypt (bcryptjs — pure JS, no native build).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}