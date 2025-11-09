/**
 * Edge Runtime Middleware - Lightweight Security Layer
 *
 * This middleware runs on Edge Runtime for optimal performance.
 * It handles:
 * - CSRF protection
 * - In-memory rate limiting with aggressive cleanup
 * - Suspicious path detection
 * - IP blocking (synced from database via cron)
 *
 * Memory is managed aggressively to prevent leaks.
 * Database writes happen via /api/security/sync cron endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  generateCSRFToken,
  setCSRFCookie,
} from "./lib/csrfProtection";
import { jwtVerify } from "jose";

// === CONFIGURATION ===
const SECRET_ENV = process.env.SECRET_KEY;
const SECRET_KEY = SECRET_ENV
  ? new TextEncoder().encode(SECRET_ENV)
  : undefined;

// Rate Limiting Configuration
const GENERAL_WINDOW = 15 * 60 * 1000; // 15 minutes
const GENERAL_MAX_REQUESTS = 500;
const API_WINDOW = 60 * 1000; // 1 minute
const API_MAX_REQUESTS = 30;

// Memory Management Configuration
const MAX_MAP_SIZE = 200; // Reduced from 300 for tighter control
const CLEANUP_INTERVAL = 20 * 1000; // 20 seconds - aggressive cleanup
const BLOCKED_IP_SYNC_INTERVAL = 60 * 1000; // Sync from external source every 60s

// === TYPE DEFINITIONS ===
type RateLimitEntry = {
  count: number;
  resetTime: number;
};

type SuspiciousEntry = {
  hits: number;
  paths: string[];
  lastHit: number;
};

type SecurityEvent = {
  ip: string;
  path: string;
  action: "SUSPICIOUS_PATH" | "RATE_LIMITED" | "BLOCKED";
  timestamp: number;
};

// === GLOBAL STATE (Edge Runtime Safe) ===
const globalForMiddleware = globalThis as unknown as {
  generalRateLimit?: Map<string, RateLimitEntry>;
  apiRateLimit?: Map<string, RateLimitEntry>;
  suspiciousIPs?: Map<string, SuspiciousEntry>;
  blockedIPs?: Set<string>;
  securityEvents?: SecurityEvent[];
  lastCleanupTime?: number;
  lastBlockedIPSync?: number;
  totalRequestsProcessed?: number;
};

// Initialize maps
if (!globalForMiddleware.generalRateLimit) {
  globalForMiddleware.generalRateLimit = new Map();
}
if (!globalForMiddleware.apiRateLimit) {
  globalForMiddleware.apiRateLimit = new Map();
}
if (!globalForMiddleware.suspiciousIPs) {
  globalForMiddleware.suspiciousIPs = new Map();
}
if (!globalForMiddleware.blockedIPs) {
  globalForMiddleware.blockedIPs = new Set();
}
if (!globalForMiddleware.securityEvents) {
  globalForMiddleware.securityEvents = [];
}
if (!globalForMiddleware.lastCleanupTime) {
  globalForMiddleware.lastCleanupTime = 0;
}
if (!globalForMiddleware.lastBlockedIPSync) {
  globalForMiddleware.lastBlockedIPSync = 0;
}
if (!globalForMiddleware.totalRequestsProcessed) {
  globalForMiddleware.totalRequestsProcessed = 0;
}

const generalRateLimit = globalForMiddleware.generalRateLimit;
const apiRateLimit = globalForMiddleware.apiRateLimit;
const suspiciousIPs = globalForMiddleware.suspiciousIPs;
const blockedIPs = globalForMiddleware.blockedIPs;
const securityEvents = globalForMiddleware.securityEvents;

// === SUSPICIOUS PATH PATTERNS ===
const SUSPICIOUS_PATTERNS = [
  ".env",
  "config.json",
  "credentials",
  "secrets.json",
  "laravel_session",
  "XDEBUG_SESSION",
  "owa/auth",
  "remote/fgt",
  "vendor/phpunit",
  "api/v1/cmd",
  "invoker/readonly",
  "system_api.php",
  "shell.jsp",
  "cmd.jsp",
  "webshell",
  "eval.php",
  "c99.php",
  ".aws/credentials",
  "backup.sql",
  "database.sql",
  ".git/config",
  "sftp-config.json",
  "docker-compose",
  "Dockerfile",
  "terraform.tfstate",
  "swagger",
  "vpn/../",
  ".htaccess",
  ".htpasswd",
  "web-console",
  "jmx-console",
  "phpmyadmin",
  "adminer",
];

// === UTILITY FUNCTIONS ===
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0].trim() || realIP || "unknown";
}

function isSuspiciousPath(pathname: string): boolean {
  const lowerPath = pathname.toLowerCase();
  return SUSPICIOUS_PATTERNS.some((pattern) =>
    lowerPath.includes(pattern.toLowerCase())
  );
}

// === MEMORY MANAGEMENT ===
function pruneMap(
  map: Map<string, RateLimitEntry>,
  now: number,
  maxSize: number
) {
  // Remove expired entries
  let removed = 0;
  for (const [key, value] of map.entries()) {
    if (now > value.resetTime) {
      map.delete(key);
      removed++;
    }
  }

  // If still too large, remove oldest entries
  if (map.size > maxSize) {
    const entries = Array.from(map.entries());
    entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
    const toRemove = entries.slice(0, map.size - maxSize);
    toRemove.forEach(([key]) => map.delete(key));
    removed += toRemove.length;
  }

  return removed;
}

function cleanupMaps(now: number) {
  const lastCleanup = globalForMiddleware.lastCleanupTime || 0;

  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  globalForMiddleware.lastCleanupTime = now;

  // Cleanup rate limit maps
  const generalRemoved = pruneMap(generalRateLimit, now, MAX_MAP_SIZE);
  const apiRemoved = pruneMap(apiRateLimit, now, MAX_MAP_SIZE);

  // Cleanup suspicious IPs (remove entries older than 1 hour)
  const oneHourAgo = now - 60 * 60 * 1000;
  let suspiciousRemoved = 0;
  for (const [ip, entry] of suspiciousIPs.entries()) {
    if (entry.lastHit < oneHourAgo) {
      suspiciousIPs.delete(ip);
      suspiciousRemoved++;
    }
  }

  // Limit security events to last 1000
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000);
  }

  // Log cleanup stats in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Middleware Cleanup] General: ${generalRemoved}, API: ${apiRemoved}, Suspicious: ${suspiciousRemoved}, Events: ${securityEvents.length}, Total Requests: ${globalForMiddleware.totalRequestsProcessed}`
    );
  }
}

// === RATE LIMITING ===
function recordRequest(
  map: Map<string, RateLimitEntry>,
  ip: string,
  windowMs: number,
  maxRequests: number,
  now: number
): boolean {
  const entry = map.get(ip);

  if (!entry || now > entry.resetTime) {
    map.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// === MIDDLEWARE HANDLER ===
export async function middleware(request: NextRequest) {
  const now = Date.now();
  const { pathname } = request.nextUrl;
  const normalizedPath = (() => {
    if (pathname === "/") {
      return "/";
    }

    const trimmed = pathname.replace(/\/+$/, "");
    return trimmed.length === 0 ? "/" : trimmed;
  })();
  const ip = getClientIP(request);

  // === EXEMPTIONS FOR INTERNAL/CRON ENDPOINTS ===
  // Skip all middleware checks for internal API routes used by cron jobs
  if (
    pathname.startsWith("/api/internal/") ||
    pathname.startsWith("/api/security/")
  ) {
    return NextResponse.next();
  }

  // Increment request counter
  if (globalForMiddleware.totalRequestsProcessed !== undefined) {
    globalForMiddleware.totalRequestsProcessed++;
  }

  // Periodic cleanup
  cleanupMaps(now);

  // === 1. CHECK BLOCKED IPS ===
  if (blockedIPs.has(ip)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // === 2. CHECK SUSPICIOUS PATHS ===
  if (isSuspiciousPath(pathname)) {
    const entry = suspiciousIPs.get(ip) || { hits: 0, paths: [], lastHit: now };
    entry.hits++;
    entry.lastHit = now;

    if (!entry.paths.includes(pathname)) {
      entry.paths.push(pathname);
    }

    suspiciousIPs.set(ip, entry);

    // Log security event
    securityEvents.push({
      ip,
      path: pathname,
      action: "SUSPICIOUS_PATH",
      timestamp: now,
    });

    // Block after 3 suspicious hits
    if (entry.hits >= 3) {
      blockedIPs.add(ip);
      securityEvents.push({
        ip,
        path: pathname,
        action: "BLOCKED",
        timestamp: now,
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    return new NextResponse("Not Found", { status: 404 });
  }

  // === 3. RATE LIMITING ===
  const isAPIRoute = pathname.startsWith("/api");
  const rateMap = isAPIRoute ? apiRateLimit : generalRateLimit;
  const windowMs = isAPIRoute ? API_WINDOW : GENERAL_WINDOW;
  const maxRequests = isAPIRoute ? API_MAX_REQUESTS : GENERAL_MAX_REQUESTS;

  const isRateLimited = recordRequest(rateMap, ip, windowMs, maxRequests, now);

  if (isRateLimited) {
    securityEvents.push({
      ip,
      path: pathname,
      action: "RATE_LIMITED",
      timestamp: now,
    });
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // === 4. CSRF PROTECTION ===
  const method = request.method;
  const isStateMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
  const isFileUploadRoute = pathname.startsWith(
    "/api/admin/employees/upload-photo"
  );

  // ✅ CSRF protection now INCLUDES auth routes for maximum security
  // Previously excluded, but auth endpoints are critical attack vectors
  if (isStateMutating && !isFileUploadRoute) {
    const isValid = validateCSRFToken(request);
    if (!isValid) {
      return new NextResponse("CSRF validation failed", { status: 403 });
    }
  }

  // === 5. SESSION VALIDATION & SMART REDIRECTS (Edge-Level) ===
  const sessionToken = request.cookies.get("session")?.value;
  let hasValidSession = false;
  let userRole: string | null = null;

  if (sessionToken && SECRET_KEY) {
    try {
      const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
      hasValidSession = true;
      userRole = (payload.role as string) || null;
    } catch (error) {
      hasValidSession = false;
      userRole = null;
    }
  }

  const isAdminRoute =
    normalizedPath.startsWith("/admin") ||
    normalizedPath.startsWith("/api/admin");

  const STATIC_AUTH_PAGES = new Set([
    "/login",
    "/register",
    "/first-time-setup",
    "/forgot-password",
  ]);
  const isAuthPage =
    STATIC_AUTH_PAGES.has(normalizedPath) ||
    normalizedPath.startsWith("/reset-password");
  const isRootPath = normalizedPath === "/";

  // REDIRECT 1: Root path with valid session → /dashboard
  if (isRootPath && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // REDIRECT 2: Root path without session → /login
  if (isRootPath && !hasValidSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // REDIRECT 3: Auth pages with valid session → /dashboard
  if (isAuthPage && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // REDIRECT 4: Admin routes - check session AND role
  if (isAdminRoute) {
    if (!hasValidSession) {
      if (isAPIRoute) {
        return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const isAdmin =
      userRole === "Admin" ||
      userRole === "SuperAdmin" ||
      userRole === "HRAdmin";

    if (!isAdmin) {
      if (isAPIRoute) {
        return new NextResponse(
          JSON.stringify({ message: "Forbidden - Admin access required" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // REDIRECT 5: Protected routes without session → /login
  const isPublicRoute = isAuthPage || isRootPath;
  const isAPIAuthRoute = pathname.startsWith("/api/auth");
  const isProtectedRoute = !isAPIAuthRoute && !isPublicRoute;

  if (isProtectedRoute && !hasValidSession) {
    if (isAPIRoute) {
      return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // === 6. PREPARE RESPONSE ===
  const response = NextResponse.next();

  // Set CSRF token
  const existingToken = request.cookies.get("csrf-token");
  if (!existingToken) {
    const csrfToken = generateCSRFToken();
    setCSRFCookie(response, csrfToken);
  }

  return response;
}

// === EXPORT SECURITY DATA (for sync endpoint) ===
export function getSecurityData() {
  return {
    events: [...securityEvents],
    suspicious: Array.from(suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      ...data,
    })),
    blocked: Array.from(blockedIPs),
  };
}

// Export rate limit data for database persistence
export function getRateLimitData() {
  return {
    general: Array.from(generalRateLimit.entries()).map(([ip, data]) => ({
      ip,
      count: data.count,
      resetTime: data.resetTime,
      type: "GENERAL" as const,
    })),
    api: Array.from(apiRateLimit.entries()).map(([ip, data]) => ({
      ip,
      count: data.count,
      resetTime: data.resetTime,
      type: "API" as const,
    })),
  };
}

export function clearSecurityEvents() {
  securityEvents.length = 0;
}

export function addBlockedIP(ip: string) {
  blockedIPs.add(ip);
}

export function removeBlockedIP(ip: string) {
  blockedIPs.delete(ip);
}

export function syncBlockedIPs(ips: string[]) {
  blockedIPs.clear();
  ips.forEach((ip) => blockedIPs.add(ip));
}

export function getMiddlewareMetrics() {
  const generalUtilization = (generalRateLimit.size / MAX_MAP_SIZE) * 100;
  const apiUtilization = (apiRateLimit.size / MAX_MAP_SIZE) * 100;
  const suspiciousUtilization = (suspiciousIPs.size / MAX_MAP_SIZE) * 100;

  return {
    generalRateLimit: {
      size: generalRateLimit.size,
      maxSize: MAX_MAP_SIZE,
      utilizationPercent: Number.isFinite(generalUtilization)
        ? generalUtilization
        : 0,
    },
    apiRateLimit: {
      size: apiRateLimit.size,
      maxSize: MAX_MAP_SIZE,
      utilizationPercent: Number.isFinite(apiUtilization) ? apiUtilization : 0,
    },
    suspiciousIPs: {
      size: suspiciousIPs.size,
      maxSize: MAX_MAP_SIZE,
      utilizationPercent: Number.isFinite(suspiciousUtilization)
        ? suspiciousUtilization
        : 0,
    },
    blockedIPs: blockedIPs.size,
    totalRequestsProcessed: globalForMiddleware.totalRequestsProcessed ?? 0,
    lastCleanupTime: globalForMiddleware.lastCleanupTime ?? 0,
    lastBlockedIPSync: globalForMiddleware.lastBlockedIPSync ?? 0,
  };
}

// === MATCHER CONFIGURATION ===
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.*\\.ico|mavn-logo-white.png|mi-favicon-bw-copy.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.webp|.*\\.gif).*)",
  ],
};
