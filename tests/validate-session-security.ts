/* eslint-disable @typescript-eslint/no-require-imports -- CJS loads allow persistence stubs without live services. */
import { strict as assert } from "node:assert";
import Module from "node:module";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import {
  createSessionToken, verifySessionToken, isSessionExpired, sessionAbsoluteExpiry,
  sessionCookieOptions,
} from "../src/lib/sessionSecurity";

// Exercise real handlers with a synthetic database; no external services are used.
const originalLoad = (Module as any)._load;
const now = Date.now();
let token: string | undefined;
let row: any;
let loginUser: any;
let databaseFailure = false;
let refreshCount = 0;
let limiterFailure = false;
let limiterAllowed = true;
const passwordComparisons: { password: string; hash: string }[] = [];
const db: any = {
  session: {
    findUnique: async () => { if (databaseFailure) throw new Error("private database URL"); return row ? { ...row } : null; },
    updateMany: async ({ data, where }: any) => {
      if (!row || (where.token && row.token !== where.token)) return { count: 0 };
      Object.assign(row, data);
      if (data.expiresAt) refreshCount++;
      return { count: 1 };
    },
    findUniqueOrThrow: async () => { if (!row) throw new Error("missing"); return row; },
    delete: async () => { row = null; },
    findFirst: async () => null,
    findMany: async () => [],
    create: async ({ data }: any) => { row = { ...data, id: "new-session", user: loginUser, createdAt: new Date() }; return row; },
    update: async ({ data }: any) => { Object.assign(row, data); return row; },
  },
  activityLog: { updateMany: async () => ({ count: 0 }), create: async () => ({}) },
  user: { findUnique: async () => { if (databaseFailure) throw new Error("private login database URL"); return loginUser; } },
  $transaction: async (fn: any) => fn(db),
};
(Module as any)._load = function (request: string, ...args: any[]) {
  if (request === "bcrypt") return { compare: async (password: string, hash: string) => {
    passwordComparisons.push({ password, hash });
    return password === "correct";
  } };
  if (request === "@/lib/rateLimit") return { consumeRateLimit: async () => {
    if (limiterFailure) throw new Error("private limiter database URL");
    return { allowed: limiterAllowed, retryAfter: 60 };
  } };
  if (request === "next/headers") return { cookies: async () => ({ get: (key: string) => ({ value: key === "session" ? token : "infertility" }) }) };
  if (request === "@/lib/prisma") return { prisma: db };
  if (request.includes("staffShiftClosureService")) return { closeActiveStaffCashShiftsIfNoUnexpiredSession: async () => null };
  if (request === "@/services/shiftService") return { shiftService: { ensureActiveShift: async () => {} } };
  if (request === "@/services/infertilityShiftService") return { infertilityShiftService: { ensureActiveShift: async () => {} } };
  if (request === "@/lib/securityActions") return {
    trackLoginAttempt: async () => {}, trackSuspiciousActivity: async () => {},
    getFailedLoginAttempts: async () => 0, getFailedLoginAttemptsForUser: async () => 0,
    checkIPBlock: async () => ({ isBlocked: false }), blockIP: async () => {},
  };
  return originalLoad.call(this, request, ...args);
};

async function main() {
  delete process.env.SECRET_KEY;
  // Route imports must remain safe during builds without runtime secrets.
  const { POST: login } = require("../src/app/api/auth/login/route");
  const { GET: verify } = require("../src/app/api/auth/verify-session/route");
  const { POST: switchPortal } = require("../src/app/api/auth/switch-portal/route");
  const { getAuthenticatedUserForAPI } = require("../src/lib/auth-validation");
  assert.throws(() => verifySessionToken("unsigned"));
  process.env.SECRET_KEY = "synthetic-test-secret-never-used-in-production";
  const secret = process.env.SECRET_KEY;
  process.env.SESSION_EXPIRATION_HOURS = "24";
  process.env.SESSION_ABSOLUTE_LIFETIME_HOURS = "168";
  token = createSessionToken({ userId: 1, portal: "general" }, now);
  const payload = verifySessionToken(token, now);
  assert.equal(payload.exp! - payload.iat!, 7 * 24 * 3600);
  assert.throws(() => verifySessionToken(jwt.sign({ userId: 1 }, secret, { algorithm: "HS384", expiresIn: 60 })));
  assert.throws(() => verifySessionToken(jwt.sign({ userId: 1 }, secret)));
  assert.throws(() => verifySessionToken(jwt.sign({ userId: 1 }, secret, { expiresIn: -1 })));
  const user = { password: "$2b$12$synthetic-stored-user-password-hash", id: 1, username: "test", role: "system-admin", isActive: true, staffId: 1,
    staff: { id: 1, firstName: "Test", lastName: "User", fullName: "Test User", role: "operator", isActive: true } };
  row = { id: "session-1", token, user, portal: "general", createdAt: new Date(now), expiresAt: new Date(now + 30 * 60_000) };
  assert.equal(isSessionExpired(row, payload, now), false);
  assert.equal(isSessionExpired({ ...row, expiresAt: new Date(now) }, payload, now), true);
  assert.equal(isSessionExpired({ ...row, createdAt: new Date(now - 8 * 24 * 3600_000) }, payload, now), true);
  const request = () => new NextRequest("http://localhost/api/auth/verify-session");
  const refreshed = await verify(request());
  assert.equal(refreshed.status, 200);
  assert.equal((await refreshed.json()).user.portal, "general", "client portal cookie is not authority");
  assert.equal(refreshCount, 1);
  assert.equal(refreshed.cookies.get("session"), undefined, "refresh cannot overwrite concurrent portal switch cookies");
  assert.ok(row.expiresAt.getTime() <= sessionAbsoluteExpiry(row, payload));
  assert.equal((await verify(request())).status, 200);
  assert.equal((await getAuthenticatedUserForAPI()).portal, "general");
  assert.equal(refreshCount, 1, "fresh sessions are not repeatedly rewritten");
  const legacyToken = jwt.sign({ userId: 1, portal: "general" }, secret, { expiresIn: 3600 });
  token = legacyToken;
  row.token = token;
  row.expiresAt = new Date(now + 20 * 60_000);
  await verify(request());
  assert.ok(row.expiresAt.getTime() <= verifySessionToken(token).exp! * 1000, "legacy token cannot outlive signed exp");
  row.expiresAt = new Date(now - 1);
  const switchRequest = new NextRequest("http://localhost/api/auth/switch-portal", {
    method: "POST", headers: { cookie: "csrf-token=test", "x-csrf-token": "test", "Content-Type": "application/json" },
    body: JSON.stringify({ portal: "general" }),
  });
  assert.equal((await switchPortal(switchRequest)).status, 401, "same-portal shortcut must check expiry");
  row = null;
  assert.equal((await verify(request())).status, 401, "revocation is enforced");
  databaseFailure = true;
  const failed = await verify(request());
  assert.equal(failed.status, 500);
  assert.equal((await failed.json()).error, "Session verification failed");
  assert.equal(failed.cookies.get("session"), undefined);
  databaseFailure = false;
  const loginRequest = (password = "correct") => new NextRequest("http://localhost/api/auth/login", { method: "POST",
    headers: { cookie: "csrf-token=test", "x-csrf-token": "test", "Content-Type": "application/json" },
    body: JSON.stringify({ username: "test", password, portal: "general" }) });
  for (const candidate of [null, { ...user, isActive: false }, { ...user, staff: { ...user.staff, isActive: false } }]) {
    loginUser = candidate;
    const comparisonCount = passwordComparisons.length;
    const result = await login(loginRequest());
    assert.equal(passwordComparisons.length, comparisonCount + 1, "missing/inactive users incur one bcrypt comparison");
    const comparison = passwordComparisons.at(-1)!;
    if (!candidate) {
      assert.match(comparison.hash, /^\$2b\$12\$/);
      assert.notEqual(comparison.hash, user.password, "missing username uses fixed cost-12 dummy hash");
    } else {
      assert.equal(comparison.hash, candidate.password, "inactive accounts compare stored password before rejection");
    }
    assert.equal(result.status, 401);
    assert.equal((await result.json()).error, "Invalid username or password");
  }
  loginUser = user;
  const beforeWrongPassword = passwordComparisons.length;
  assert.equal((await login(loginRequest("incorrect"))).status, 401);
  assert.equal(passwordComparisons.length, beforeWrongPassword + 1);
  assert.deepEqual(passwordComparisons.at(-1), { password: "incorrect", hash: user.password });
  const successfulLogin = await login(loginRequest());
  assert.equal(successfulLogin.status, 200);
  assert.deepEqual(passwordComparisons.at(-1), { password: "correct", hash: user.password });
  token = successfulLogin.cookies.get("session")!.value;
  assert.equal((await verify(request())).status, 200);
  const switchRequestForRace = () => new NextRequest("http://localhost/api/auth/switch-portal", {
    method: "POST", headers: { cookie: "csrf-token=test", "x-csrf-token": "test", "Content-Type": "application/json" },
    body: JSON.stringify({ portal: "infertility" }),
  });
  const switches = await Promise.all([switchPortal(switchRequestForRace()), switchPortal(switchRequestForRace())]);
  assert.deepEqual(switches.map((r: Response) => r.status).sort(), [200, 409]);
  const switched = switches.find((r: Response) => r.status === 200)!;
  const conflict = switches.find((r: Response) => r.status === 409)!;
  assert.equal(conflict.cookies.get("session"), undefined, "losing switch never overwrites cookie");
  assert.equal(switched.status, 200);
  const switchedToken = switched.cookies.get("session")!.value;
  assert.notEqual(switchedToken, token);
  assert.equal(verifySessionToken(switchedToken).exp, verifySessionToken(token!).exp);
  assert.equal(verifySessionToken(switchedToken).portal, "infertility");
  limiterAllowed = false;
  assert.equal((await login(loginRequest())).status, 429);
  limiterAllowed = true;
  limiterFailure = true;
  const unavailable = await login(loginRequest());
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).error.includes("private"), false);
  limiterFailure = false;
  databaseFailure = true;
  const loginFailure = await login(loginRequest());
  assert.equal(loginFailure.status, 500);
  assert.equal((await loginFailure.json()).error, "An error occurred during login");
  databaseFailure = false;
  delete process.env.SECRET_KEY;
  assert.equal(await getAuthenticatedUserForAPI(), null);
  assert.equal((await login(loginRequest())).status, 500);
  assert.equal((await verify(request())).status, 401);
  Object.assign(process.env, { NODE_ENV: "production", SESSION_COOKIE_SECURE: "false", SESSION_COOKIE_HTTP_ONLY: "false" });
  assert.equal(sessionCookieOptions().secure, true);
  assert.equal(sessionCookieOptions().httpOnly, true);
  console.log("Session security validation passed");
}
main().finally(() => { (Module as any)._load = originalLoad; }).catch(error => { console.error(error); process.exitCode = 1; });
