import jwt, { type JwtPayload } from "jsonwebtoken";
import { randomUUID } from "crypto";

function positiveHours(value: string | undefined, fallback: number): number {
  const hours = Number(value);
  return Number.isFinite(hours) && hours > 0 ? hours : fallback;
}

export function sessionIdleMilliseconds(): number {
  return positiveHours(process.env.SESSION_EXPIRATION_HOURS, 24) * 3_600_000;
}

export function sessionAbsoluteMilliseconds(): number {
  return positiveHours(process.env.SESSION_ABSOLUTE_LIFETIME_HOURS, 168) * 3_600_000;
}

// Resolve at request time: importing a route during a build must not require secrets.
export function requireSessionSecret(): string {
  const secret = process.env.SECRET_KEY;
  if (!secret) throw new Error("Session signing is unavailable");
  return secret;
}

export function verifySessionToken(token: string, now = Date.now()): JwtPayload {
  const payload = jwt.verify(token, requireSessionSecret(), {
    algorithms: ["HS256"],
    clockTimestamp: Math.floor(now / 1000),
  });
  if (typeof payload === "string" || !Number.isFinite(payload.exp) ||
      !Number.isFinite(payload.iat) || payload.iat! > Math.floor(now / 1000)) {
    throw new Error("Invalid session token");
  }
  return payload;
}

export function createSessionToken(claims: Record<string, unknown>, now = Date.now()): string {
  return jwt.sign({ ...claims, iat: Math.floor(now / 1000),
    exp: Math.floor((now + sessionAbsoluteMilliseconds()) / 1000) },
    requireSessionSecret(), { algorithm: "HS256", jwtid: randomUUID() });
}

export function sessionAbsoluteExpiry(
  session: { createdAt: Date }, payload: JwtPayload,
): number {
  return Math.min(payload.exp! * 1000,
    session.createdAt.getTime() + sessionAbsoluteMilliseconds());
}

export function isSessionExpired(
  session: { createdAt: Date; expiresAt: Date }, payload: JwtPayload, now = Date.now(),
): boolean {
  return session.expiresAt.getTime() <= now || sessionAbsoluteExpiry(session, payload) <= now;
}

export function sessionCookieOptions() {
  const production = process.env.NODE_ENV === "production";
  const configuredSameSite = process.env.SESSION_COOKIE_SAME_SITE;
  const sameSite: "lax" | "none" | "strict" = configuredSameSite === "lax" || configuredSameSite === "none" ? configuredSameSite : "strict";
  return {
    httpOnly: production || process.env.SESSION_COOKIE_HTTP_ONLY !== "false",
    secure: production || process.env.SESSION_COOKIE_SECURE === "true",
    sameSite,
    path: "/",
  };
}
