/**
 * In-memory sliding-window rate limiter keyed by client identifier.
 *
 * Suitable for a single instance. For multi-instance deployments swap this
 * for a shared store (Redis/Upstash) without changing the caller sites.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const BUCKET_TTL_MS = 10 * 60 * 1000;

let lastCleanup = Date.now();

function keyFor(identifier: string, scope: string): string {
  return `${scope}:${identifier}`;
}

export function isRateLimited(options: {
  identifier: string;
  scope: string;
  limit: number;
  windowMs: number;
}): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [key, bucket] of buckets) {
      const alive = bucket.timestamps.filter((t) => now - t < BUCKET_TTL_MS);
      if (alive.length === 0) {
        buckets.delete(key);
      } else {
        bucket.timestamps = alive;
      }
    }
  }

  const key = keyFor(options.identifier, options.scope);
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter(
    (t) => now - t < options.windowMs
  );

  if (bucket.timestamps.length >= options.limit) {
    const oldest = bucket.timestamps[0];
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  return { limited: false, retryAfterSeconds: 0 };
}

/** Best-effort public client identifier from request headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip")?.trim() || "unknown";
}