import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Centralised HTTP helpers.
 *
 * Every API response goes through these functions so the error shape, HTTP
 * status codes, and the "never leak stack traces" rule stay in one place.
 */

export class AppError extends Error {
  readonly status: number;
  readonly fields: Record<string, string | undefined> | undefined;
  /** Stable machine-readable identifier the client can branch on. */
  readonly code?: string;

  constructor(
    message: string,
    status = 400,
    fields?: Record<string, string | undefined>,
    code?: string
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

interface ErrorBody {
  error: string;
  fields?: Record<string, string | undefined>;
  code?: string;
}

function toErrorBody(error: unknown): ErrorBody {
  if (error instanceof AppError) {
    return {
      error: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
      ...(error.code ? { code: error.code } : {}),
    };
  }
  if (error instanceof ZodError) {
    const entries = error.issues.map((issue) => {
      const path = issue.path.join(".");
      return [path || "form", issue.message];
    });
    return { error: "Invalid input.", fields: Object.fromEntries(entries) };
  }
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: "Something went wrong." };
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(error: unknown, fallbackStatus = 500): NextResponse {
  // Validation failures (Zod) are client errors, never server errors.
  const status =
    error instanceof AppError
      ? error.status
      : error instanceof ZodError
        ? 400
        : fallbackStatus;
  return NextResponse.json(toErrorBody(error), { status });
}

function isTrustedError(error: unknown): boolean {
  return error instanceof AppError || error instanceof ZodError;
}

/**
 * Wraps a route handler so thrown errors normalize to one response shape.
 * Unexpected errors return a generic 500 with no internal details.
 */
export async function run(
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (isTrustedError(error)) return fail(error);
    console.error("Unhandled API error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export const httpError = {
  badRequest: (message: string) => new AppError(message, 400),
  unauthorized: (message = "Authentication required.", code?: string) =>
    new AppError(message, 401, undefined, code),
  forbidden: (message = "You do not have permission to do this.") =>
    new AppError(message, 403),
  notFound: (message = "Not found.") => new AppError(message, 404),
  conflict: (message: string, code?: string) =>
    new AppError(message, 409, undefined, code),
};

/** Safely parses a JSON request body, returning 400 on malformed JSON. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw httpError.badRequest("A JSON object body is required.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw httpError.badRequest("Invalid JSON body.");
  }
}