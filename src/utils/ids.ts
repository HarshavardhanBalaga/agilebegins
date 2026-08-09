import { ObjectId } from "mongodb";
import { httpError } from "@/lib/http";

const OBJECT_ID_HEX = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value: string): boolean {
  return OBJECT_ID_HEX.test(value);
}

/**
 * Converts a trusted string to an ObjectId. Throws a 400 AppError for
 * malformed ids so callers never pass garbage to the driver.
 */
export function toObjectId(value: string): ObjectId {
  if (!isObjectId(value)) {
    throw httpError.badRequest("Invalid id format.");
  }
  return new ObjectId(value);
}

export function toOptionalObjectId(
  value: string | null | undefined
): ObjectId | null {
  if (!value) return null;
  if (!isObjectId(value)) {
    throw httpError.badRequest("Invalid id format.");
  }
  return new ObjectId(value);
}