/* eslint-disable @typescript-eslint/no-require-imports -- CJS loads allow persistence stubs without live services. */
import assert from "node:assert/strict";
import Module from "node:module";
import { existsSync, readdirSync } from "node:fs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { getClientIP } from "../src/lib/clientIp";
import { validateCronSecret } from "../src/lib/cronAuthentication";
import { PublicError, publicErrorMessage } from "../src/lib/publicError";
import { getSecurityHeaders } from "../security-headers.mjs";

async function main() {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 192.0.2.8" });
  assert.equal(getClientIP(headers, "0"), "unknown");
  assert.equal(getClientIP(headers, "1"), "192.0.2.8", "one trusted proxy ignores the spoofed first address");
  assert.equal(getClientIP(headers, "2"), "203.0.113.5");
  assert.equal(getClientIP(headers, "3"), "unknown");
  assert.equal(getClientIP(new Headers({ "x-forwarded-for": "injected host" }), "1"), "unknown");
  delete process.env.CRON_SECRET;
  assert.equal(validateCronSecret(new Request("http://localhost")), false);
  process.env.CRON_SECRET = "synthetic-cron-validation";
  assert.equal(validateCronSecret(new Request("http://localhost", { headers: { "x-cron-secret": "wrong" } })), false);
  assert.equal(validateCronSecret(new Request("http://localhost", { headers: { "x-cron-secret": process.env.CRON_SECRET } })), true);
  const privateFailure = new Error("Invalid Prisma invocation: postgresql://private-host/patient-data; record not found");
  assert.equal(publicErrorMessage(privateFailure), "Unable to process request");
  assert.equal(publicErrorMessage(new PublicError("Insufficient stock")), "Insufficient stock");
  const productionHeaders = getSecurityHeaders(true);
  assert.equal(productionHeaders["X-Frame-Options"], "DENY");
  assert.equal(productionHeaders["X-Content-Type-Options"], "nosniff");
  assert.ok(!productionHeaders["Content-Security-Policy"].includes("unsafe-eval"));
  assert.ok(productionHeaders["Content-Security-Policy"].includes("frame-src 'self' blob:"), "PDF printing remains supported");
  assert.ok(!("Strict-Transport-Security" in getSecurityHeaders(false)), "local HTTP development is not forced to HTTPS");
  const configModule = await import("../next.config.mjs");
  const configured = await configModule.default.headers!();
  assert.ok(configured.some((route) => route.source === "/api/:path*" && route.headers.some((header) => header.key === "Cache-Control" && header.value.includes("no-store"))));

  // Use the real middleware, with synthetic tokens and no database access.
  process.env.SECRET_KEY = "synthetic-hardening-test-secret";
  process.env.TRUST_PROXY_HOPS = "0";
  const { middleware, config } = require("../src/middleware");
  for (const url of ["/api/admissions/123.json", "/api/infertility-patients/123.png", "/api/patient-records/123.json/", "/profile"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "http://localhost" + url }), true);
  }
  const request = (path: string, token?: string) => new NextRequest("http://localhost" + path, { headers: token ? { cookie: `session=${token}` } : {} });
  const login = await middleware(request("/login"));
  assert.equal(login.status, 200);
  assert.ok(login.cookies.get("csrf-token")?.value, "logged-out login receives a CSRF token");
  assert.ok((await middleware(request("/profile"))).headers.get("location")?.endsWith("/login"));
  const valid = jwt.sign({ userId: 1, role: "receptionist", portal: "general" }, process.env.SECRET_KEY, { expiresIn: 3600 });
  assert.equal((await middleware(request("/profile", valid))).status, 200);
  assert.equal((await middleware(request("/login", valid))).status, 200, "a revoked but signed JWT must not prevent login recovery");
  for (const [role, algorithm, expiresIn] of [["unknown-role", "HS256", 3600], ["admin", "HS384", 3600], ["admin", "HS256", -1]] as const) {
    const invalid = jwt.sign({ userId: 1, role, portal: "general" }, process.env.SECRET_KEY, { algorithm, expiresIn });
    assert.ok((await middleware(request("/dashboard", invalid))).headers.get("location")?.endsWith("/login"));
  }
  assert.equal((await middleware(request("/.env"))).status, 404);
  assert.equal((await middleware(request("/.env"))).status, 404);
  assert.equal((await middleware(request("/.env"))).status, 404);
  assert.equal((await middleware(request("/login"))).status, 200, "scanner traffic cannot block all unidentified users");

  // Exercise limiter boundaries and parameterization without connecting to a real service.
  const originalLoad = (Module as any)._load;
  let count = 0;
  let parameters: unknown[] = [];
  (Module as any)._load = function (name: string, ...args: any[]) {
    if (name === "@/lib/prisma") return { prisma: { $queryRaw: async (_sql: TemplateStringsArray, ...values: unknown[]) => {
      parameters = values;
      return [{ request_count: ++count }];
    } } };
    return originalLoad.call(this, name, ...args);
  };
  try {
    const { consumeRateLimit, getApiRateLimitOptions } = require("../src/lib/rateLimit");
    const options = { key: "user:1' --", bucket: "api", limit: 2, windowMs: 60_000 };
    assert.equal((await consumeRateLimit(options, 1000)).allowed, true);
    assert.equal((await consumeRateLimit(options, 2000)).allowed, true);
    const limited = await consumeRateLimit(options, 3000);
    assert.equal(limited.allowed, false);
    assert.equal(limited.retryAfter, 57);
    assert.equal(parameters[0], options.key, "identifiers are bound SQL parameters");
    assert.equal(getApiRateLimitOptions(99).key, "user:99", "users behind one proxy have independent quotas");
  } finally {
    (Module as any)._load = originalLoad;
  }
  assert.deepEqual(readdirSync("docs/migration-mappings").filter((file) => file.endsWith(".json")), ["example.json"]);
  assert.equal(existsSync("public/INFERTILITY_OVERHAUL_PLAN.md"), false);
  console.log("Headers, middleware recovery, trusted proxy, cron, limiter, error and repository hygiene validation passed");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
