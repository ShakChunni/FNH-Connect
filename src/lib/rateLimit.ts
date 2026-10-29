import { prisma } from "@/lib/prisma";

export interface RateLimitOptions {
  key: string;
  bucket: string;
  limit: number;
  windowMs: number;
}

export function positiveSetting(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getApiRateLimitOptions(userId: number): RateLimitOptions {
  return {
    key: `user:${userId}`,
    bucket: "api",
    limit: positiveSetting(process.env.API_RATE_LIMIT_MAX_REQUESTS, 120),
    windowMs: positiveSetting(process.env.API_RATE_LIMIT_WINDOW_MINUTES, 1) * 60_000,
  };
}

/** PostgreSQL is shared across instances; the upsert atomically counts concurrent requests. */
export async function consumeRateLimit(
  { key, bucket, limit, windowMs }: RateLimitOptions,
  now = Date.now(),
) {
  const start = new Date(Math.floor(now / windowMs) * windowMs);
  const end = new Date(start.getTime() + windowMs);
  const rows = await prisma.$queryRaw<{ request_count: number }[]>`
    INSERT INTO "RateLimit" ("ip_address", "path", "request_count", "window_start", "window_end")
    VALUES (${key}, ${bucket}, 1, ${start}, ${end})
    ON CONFLICT ("ip_address", "path", "window_start")
    DO UPDATE SET "request_count" = LEAST("RateLimit"."request_count" + 1, ${limit + 1})
    RETURNING "request_count"
  `;
  return {
    allowed: rows[0].request_count <= limit,
    retryAfter: Math.max(1, Math.ceil((end.getTime() - now) / 1000)),
  };
}
