# FNH Connect — End-to-End Security Audit Report

> **Audit date:** 2026-06-16  
> **Scope:** Next.js 15.5.18 App Router, Prisma 6.16.2, PostgreSQL, custom JWT/session auth  
> **Methodology:** Static code review, route-handler inventory, middleware/auth/session flow analysis, Prisma schema review, Context7 latest-practice cross-check.

---

## 1. Executive Summary

The application has a **mature baseline** of security controls: HttpOnly session cookies, bcrypt password hashing, double-submit CSRF, middleware-based rate limiting, role/portal enforcement, and broad use of Zod validation. However, several **medium-to-high severity gaps** remain that could lead to information disclosure, privilege/control abuse, or authentication bypass in production.

The most important fixes are:

1. Stop leaking account state in login error messages.
2. Apply the already-defined `SECURITY_HEADERS`.
3. Make session revocation effective in middleware (or rotate/restrict tokens).
4. Remove client-side control of `logoutAllDevices`.
5. Validate `shiftId`, `status`, and other business inputs strictly.
6. Fix IP-address trust assumptions behind proxies.
7. Add missing DB indexes and a soft-delete/archive strategy for clinical/financial records.

> **Note on local environment:** Per your instruction, findings related to the local `.env` file and tracked seed scripts are treated as **local-development hygiene issues**, not active production vulnerabilities. They are listed in Section 8 for cleanup only.

---

## 2. Risk Legend

| Severity | Meaning |
|----------|---------|
| 🔴 Critical | Immediate exploit likely; high business impact. |
| 🟠 High | Exploitable with moderate effort; should be fixed soon. |
| 🟡 Medium | Defense-in-depth gap or limited-impact vulnerability. |
| 🟢 Low / Info | Hygiene, audit, or hardening recommendation. |

---

## 3. Findings at a Glance

| # | Severity | Category | Finding | Primary File(s) |
|---|----------|----------|---------|-----------------|
| 1 | 🟠 High | Auth | Login errors distinguish inactive/deactivated/portal-wrong accounts → **user enumeration** | `src/app/api/auth/login/route.ts` |
| 2 | 🟠 High | Auth | Raw internal errors returned from `verify-session`, `switch-portal`, and many service catch blocks | Multiple |
| 3 | 🟠 High | Auth | `logoutAllDevices` is read from the client request body in `/api/shifts/end` | `src/app/api/shifts/end/route.ts` |
| 4 | 🟠 High | Config | `SECURITY_HEADERS` is fully defined but **never applied** | `src/lib/securityConfig.ts`, `next.config.mjs` |
| 5 | 🟡 Medium | Auth | Middleware validates JWT only; it does **not** check DB session revocation | `src/middleware.ts` |
| 6 | 🟡 Medium | Auth | Sliding-window session refresh can keep a session alive indefinitely; token is not rotated | `src/app/api/auth/verify-session/route.ts` |
| 7 | 🟡 Medium | Auth | No device-fingerprint re-verification after login; stolen cookie/JWT works from any client | Auth flow |
| 8 | 🟡 Medium | Auth | `portal` cookie is non-HttpOnly and client-tamperable | `AuthContext.tsx`, auth routes |
| 9 | 🟡 Medium | Auth | `x-forwarded-for` first value is trusted for rate limiting, IP blocking, and login tracking | `src/middleware.ts`, `src/app/api/auth/login/route.ts` |
| 10 | 🟡 Medium | Auth | CSRF token length check happens before constant-time compare (minor timing leak) | `src/lib/csrfProtection.ts` |
| 11 | 🟡 Medium | Auth | `jsonwebtoken` verify does not whitelist `algorithms`; `sessionPortal.ts` falls back to `general` on invalid/missing secret | `src/lib/sessionPortal.ts` |
| 12 | 🟡 Medium | Access Control | Admin-created/reset passwords only require 8 chars, inconsistent with the strong self-change policy | Admin user-management routes |
| 13 | 🟡 Medium | Input Validation | `/api/infertility-patients/[id]/status` accepts any 50-char string, not an enum | Infertility status route |
| 14 | 🟡 Medium | Input Validation | `shiftId` is read from raw request body and passed to service without Zod validation | `POST /api/infertility-patients/tests` |
| 15 | 🟡 Medium | Input Validation | `PATCH /api/patient-records/[id]` has no Zod schema | Patient records route |
| 16 | 🟡 Medium | Input Validation | Several routes return raw `error.message` in 500 responses | Admissions, pathology, hospitals, etc. |
| 17 | 🟢 Low | DB Schema | Many commonly filtered/audit fields lack indexes | `prisma/schema.prisma` |
| 18 | 🟢 Low | DB Schema | No soft-delete fields; hard deletes are used for clinical/financial records | `prisma/schema.prisma` |
| 19 | 🟢 Low | Access Control | Route allow-lists use `startsWith` prefix matching; could over-permit new sub-routes | `src/lib/roles.ts`, `src/middleware.ts` |
| 20 | 🟢 Low | Config | Dev-mode bypass of `CRON_SECRET` on `/api/security/*` endpoints | `src/app/api/security/*` |
| 21 | 🟢 Info | Local Dev | `.env` contains live DB credentials; `SECRET_KEY` is placeholder; seed scripts contain hardcoded passwords | `.env`, `scripts/*` |

---

## 4. Detailed Findings

### 4.1 Authentication & Session

#### F-1: Account enumeration via login error messages 🟠 High

**Evidence:** `src/app/api/auth/login/route.ts:337-360`

```ts
if (!user.isActive) {
  throw new Error("Your account has been deactivated. Please contact an administrator.");
}
if (!user.staff.isActive) {
  throw new Error("Staff account is inactive");
}
```

The route also returns different messages for wrong portal and unauthorized portal access.

**Impact:** An attacker can probe usernames and learn whether an account exists, is deactivated, or belongs to a different portal.

**Fix:** Return a single generic message for any failed login path. Use the existing `GENERIC_ERRORS.INVALID_CREDENTIALS` constant. Log the specific reason server-side only.

---

#### F-2: Raw error messages returned to clients 🟠 High

**Evidence:**

- `src/app/api/auth/verify-session/route.ts:147-160` returns `error: message` directly.
- `src/app/api/auth/switch-portal/route.ts` returns `error.message`.
- Many operational routes (admissions, pathology, infertility, hospitals) return `{ error: error.message }` in their catch blocks.

**Impact:** Internal failure details (Prisma errors, DB hints, file paths) can leak to the browser, aiding reconnaissance.

**Fix:** Always return a generic message to the client and log the real error server-side:

```ts
console.error("Route error:", error);
return NextResponse.json({ error: "Unable to process request." }, { status: 500 });
```

---

#### F-3: `logoutAllDevices` controlled by client 🟠 High

**Evidence:** `src/app/api/shifts/end/route.ts:41`

```ts
const { notes, logoutAllDevices = true } = body;
```

**Impact:** A user with an active session (or an attacker via XSS/session theft) can force logout all devices for the account by ending a shift. This is a destructive account-state action that should be server-decided.

**Fix:** Remove `logoutAllDevices` from the request body. Always invalidate all sessions when a cash-handling shift is ended, or derive the behavior from the user's role/server policy.

---

#### F-4: Middleware does not honor session revocation 🟡 Medium

**Evidence:** `src/middleware.ts:335-346`

Middleware calls `jose.jwtVerify(sessionToken, SECRET_KEY)` but **never queries the `Session` table**. If a session is deleted from the DB (logout, admin kill, cleanup), the JWT is still accepted until expiry.

**Impact:** Revoked sessions can still pass middleware redirects and access decisions. Server Components/API routes that use `getAuthenticatedUserForAPI()` will eventually reject them, but middleware-level decisions (e.g., blocking `/login` for "authenticated" users) can misbehave.

**Fix options (pick one):**

- Add a lightweight DB session existence check in middleware (adds latency).
- Keep short JWT expiry and rotate tokens frequently.
- Treat JWT as a hint and defer final authorization to server helpers.

---

#### F-5: Indefinite sliding sessions with no token rotation 🟡 Medium

**Evidence:** `src/app/api/auth/verify-session/route.ts:99-143`

When less than 2 hours remain, the route extends `expiresAt` by the full window and re-sets the same cookie. There is no absolute maximum lifetime and the token never changes.

**Impact:** A stolen session cookie stays valid forever as long as the user remains active.

**Fix:** Enforce an absolute max lifetime (e.g., 7 days) and rotate the JWT at refresh.

---

#### F-6: No device binding after login 🟡 Medium

**Evidence:** `Session.deviceFingerprint` is stored but never re-verified on subsequent requests.

**Impact:** A stolen session cookie/JWT works from any browser or IP.

**Fix:** On sensitive actions, compare the current fingerprint with the stored fingerprint and require re-auth if it changes.

---

#### F-7: `portal` cookie is tamperable 🟡 Medium

**Evidence:** `AuthContext.tsx` sets `portal` with `js-cookie` and it is **not HttpOnly**. Middleware also falls back to this cookie if the JWT has no portal claim.

**Impact:** XSS or malicious extension can flip the perceived portal client-side, causing UI confusion or redirect issues.

**Fix:** Stop relying on a client-settable portal cookie. Always derive portal from the server-side JWT/DB session.

---

#### F-8: `x-forwarded-for` trusted blindly 🟡 Medium

**Evidence:**

- `src/middleware.ts:133-136`
- `src/app/api/auth/login/route.ts:196-203`

```ts
return forwardedFor?.split(",")[0].trim() || realIP || "unknown";
```

**Impact:** Without a trusted proxy stripping client-supplied `X-Forwarded-For`, attackers can spoof IPs and evade rate limits, IP blocks, and login-attempt tracking.

**Fix:** Use the rightmost trusted proxy IP, or whitelist proxy addresses and parse from `x-real-ip`.

---

#### F-9: CSRF token length check before constant-time compare 🟡 Medium

**Evidence:** `src/lib/csrfProtection.ts`

```ts
if (a.length !== b.length) return false; // leaks attacker guess length
```

**Impact:** Minor timing side-channel that tells an attacker whether a guessed token has the correct length.

**Fix:** Remove the length check from `constantTimeCompare` in `src/lib/securityConfig.ts` and use it for CSRF comparison as well.

---

#### F-10: JWT verification does not whitelist algorithms 🟡 Medium

**Evidence:** `src/lib/sessionPortal.ts`

```ts
jwt.verify(token, SECRET_KEY)
```

**Impact:** Algorithm-confusion attacks are unlikely with a symmetric secret, but explicitly whitelisting `HS256` is a defense-in-depth best practice.

**Fix:**

```ts
jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] })
```

---

### 4.2 Authorization & Access Control

#### F-11: Inconsistent password policy for admin flows 🟡 Medium

**Evidence:** Admin reset/create schemas require only `z.string().min(8)`, while self-change uses a strong 12-character complexity policy.

**Impact:** Admins can create weak passwords for other users.

**Fix:** Reuse `validatePassword()` from `src/lib/passwordPolicy.ts` for all password creation/reset flows.

---

#### F-12: `startsWith` route allow-lists 🟢 Low

**Evidence:** `src/lib/roles.ts` and `src/middleware.ts` use `pathname.startsWith(route + "/")`.

**Impact:** A new sensitive sub-route that shares a prefix with an allowed route could be unintentionally permitted.

**Fix:** Match exact paths or use a route-segment array, and review new routes against allow-lists.

---

### 4.3 Input Validation & Data Integrity

#### F-13: Infertility patient status accepts arbitrary strings 🟡 Medium

**Evidence:** `/api/infertility-patients/[id]/status`

```ts
status: z.string().trim().max(50)
```

**Impact:** Invalid statuses can be written, breaking workflows and reports.

**Fix:** Use a Zod enum of allowed statuses.

---

#### F-14: `shiftId` trusted from raw body 🟡 Medium

**Evidence:** `POST /api/infertility-patients/tests`

```ts
const shiftId = body.shiftId;
```

**Impact:** Payments/cash movements could be attributed to an attacker-chosen shift.

**Fix:** Add `shiftId` to the Zod schema with `.int().positive()` and validate before use.

---

#### F-15: Patient records update has no Zod schema 🟡 Medium

**Evidence:** `PATCH /api/patient-records/[id]` manually extracts fields and passes them directly to Prisma.

**Fix:** Add a strict Zod schema with length/format/pattern rules.

---

### 4.4 Infrastructure & Configuration

#### F-16: Security headers defined but not applied 🟠 High

**Evidence:** `src/lib/securityConfig.ts` exports `SECURITY_HEADERS`, but a project-wide search found **zero imports/usages**.

**Impact:** No `Content-Security-Policy`, `X-Frame-Options`, `HSTS`, `Permissions-Policy`, etc.

**Fix:** Apply headers in `next.config.mjs`:

```ts
async headers() {
  return [
    {
      source: "/:path*",
      headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ];
}
```

---

#### F-17: No `SECRET_KEY` enforcement at startup 🟡 Medium

**Evidence:** `src/middleware.ts:11-14` and `src/lib/auth-validation.ts` silently skip JWT verification if `SECRET_KEY` is missing.

**Fix:** Fail hard on startup when `SECRET_KEY` is missing or too short.

---

### 4.5 Database & Schema

#### F-18: Missing indexes on common filter/audit fields 🟢 Low

**Impact:** Sequential scans as data grows; performance degradation and potential DoS via slow queries.

**Fix:** Add `@@index([...])` declarations for fields listed in the schema audit (e.g., `Staff.role`, `User.role`, `InfertilityPatient.createdBy`, `Shift.endTime`, etc.).

---

#### F-19: No soft-delete strategy for clinical/financial records 🟢 Low

**Impact:** Hard deletes of patients, admissions, payments, or shifts may violate audit/legal retention requirements.

**Fix:** Add `deletedAt` / `deletedBy` columns and filter all queries with `deletedAt: null`.

---

### 4.6 Local Development Hygiene (out of production scope)

#### F-20: `.env` contains live credentials and placeholder `SECRET_KEY` 🟢 Info

**Context:** Per your note, this is local development data, but it should still be rotated and removed from the working tree.

**Fix:**

- Rotate the DigitalOcean DB password.
- Generate a strong random `SECRET_KEY`.
- Add `.env.example`.
- Ensure `.env` is gitignored and not committed.

---

#### F-21: Tracked seed scripts contain hardcoded passwords 🟢 Info

**Context:** Files under `scripts/` are tracked by git and contain plaintext passwords.

**Fix:** Pass passwords via environment variables or generate them at runtime. Rotate any accounts whose passwords appear in git history.

---

## 5. Remediation Roadmap

### Immediate (this week)

1. Apply `SECURITY_HEADERS` in `next.config.mjs`.
2. Replace login error messages with a single generic response.
3. Sanitize all 500-error responses; never return `error.message`.
4. Remove `logoutAllDevices` from the client payload in `/api/shifts/end`.
5. Enforce a single strong password policy everywhere.

### Short-term (next sprint)

6. Add DB session revocation check to middleware or rotate tokens frequently.
7. Cap absolute session lifetime and rotate JWT on refresh.
8. Add device-fingerprint checks on sensitive actions.
9. Fix `x-forwarded-for` trust logic.
10. Whitelist JWT algorithm and hard-fail on missing `SECRET_KEY`.

### Hardening (ongoing)

11. Add strict enums/Zod schemas for `status`, `shiftId`, and patient-record updates.
12. Add missing DB indexes.
13. Implement soft-delete/archive for clinical/financial records.
14. Move `portal` derivation fully server-side.
15. Audit `startsWith` route allow-lists.
16. Clean up local `.env` and seed-script credentials.

---

## 6. Positive Security Controls

These are already in place and should be preserved:

- ✅ HttpOnly `session` cookie with `SameSite=strict`.
- ✅ bcrypt password hashing with 12 rounds.
- ✅ Double-submit CSRF cookie + `x-csrf-token` header.
- ✅ Middleware rate limiting, IP blocking, and suspicious-path detection.
- ✅ Role/portal boundary enforcement in middleware.
- ✅ Zod validation on most route inputs.
- ✅ Activity logging across auth and business actions.
- ✅ Prisma `$transaction` for related writes.
- ✅ No direct Prisma client usage in Client Components.
- ✅ No Server Actions, so all mutations flow through auditable Route Handlers.

---

## 7. Conclusion

FNH Connect is well-architected for a production healthcare application, but the gaps above should be closed before handling real patient data at scale. The highest-value fixes are **applying security headers**, **eliminating account enumeration**, **sanitizing error responses**, and **fixing session revocation/rotation**.
