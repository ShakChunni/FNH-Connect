import { createHash, timingSafeEqual } from "node:crypto";

export function validateCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!secret || !provided) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(secret), digest(provided));
}
