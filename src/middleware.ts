import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { SECURITY_HEADERS } from "@/lib/securityConfig";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
  requiresCSRFValidation,
} from "@/lib/csrfProtection";

const SECRET_KEY = new TextEncoder().encode(process.env.SECRET_KEY as string);

// In-memory general rate limiting with cleanup
const generalRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();

// Rate limiting for API routes (stricter)
const apiRateLimit = new Map<string, { count: number; resetTime: number }>();

const GENERAL_WINDOW = 15 * 60 * 1000; // 15 minutes
const GENERAL_MAX_REQUESTS = 500;
const API_WINDOW = 1 * 60 * 1000; // 1 minute
const API_MAX_REQUESTS = 30; // 30 requests per minute for API routes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean every 5 minutes
const MAX_MAP_SIZE = 1000; // Prevent unlimited growth

// Cleanup function for rate limiting map
function cleanupRateLimit() {
  const now = Date.now();
  let removedCount = 0;

  // Clean general rate limit
  for (const [ip, entry] of generalRateLimit.entries()) {
    if (now > entry.resetTime) {
      generalRateLimit.delete(ip);
      removedCount++;
    }
  }

  // Clean API rate limit
  for (const [ip, entry] of apiRateLimit.entries()) {
    if (now > entry.resetTime) {
      apiRateLimit.delete(ip);
      removedCount++;
    }
  }

  // If maps are still too large after cleanup, remove oldest entries
  if (generalRateLimit.size > MAX_MAP_SIZE) {
    const entries = Array.from(generalRateLimit.entries());
    entries.sort((a, b) => a[1].resetTime - b[1].resetTime);

    const toRemove = entries.slice(0, entries.length - MAX_MAP_SIZE);
    toRemove.forEach(([ip]) => generalRateLimit.delete(ip));
    removedCount += toRemove.length;
  }

  if (apiRateLimit.size > MAX_MAP_SIZE) {
    const entries = Array.from(apiRateLimit.entries());
    entries.sort((a, b) => a[1].resetTime - b[1].resetTime);

    const toRemove = entries.slice(0, entries.length - MAX_MAP_SIZE);
    toRemove.forEach(([ip]) => apiRateLimit.delete(ip));
    removedCount += toRemove.length;
  }
}

// Set up periodic cleanup - use global to prevent duplicates across hot reloads
const globalForCleanup = globalThis as unknown as {
  middlewareCleanupInterval?: ReturnType<typeof setInterval>;
};

if (!globalForCleanup.middlewareCleanupInterval) {
  globalForCleanup.middlewareCleanupInterval = setInterval(
    cleanupRateLimit,
    CLEANUP_INTERVAL
  );
  console.log("[Middleware] Rate limit cleanup interval started");
}

const SUSPICIOUS_PATHS = [
  ".env",
  "config.json",
  "credentials.json",
  "secrets.json",
  "laravel_session",
  "XDEBUG_SESSION_START",
  "owa/auth/logon.jsp",
  "remote/fgt_lang",
  "vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
  "api/v1/cmd/",
  "invoker/readonly",
  "c/version.js",
  "system_api.php",
  "dispatch.asp",
  "shell.jsp",
  "cmd.jsp",
  "webshell.php",
  "eval.php",
  "c99.php",
  "r57.php",
  "wso.php",
  "adminer.php",
  "index.action",
  "struts2-",
  "axis2/",
  "hudson/",
  "jenkins/",
  "jmx-console/",
  "web-console/",
  "invoker/",
  ".aws/credentials",
  "backup.sql",
  "database.sql",
  "dump.sql",
  ".git/config",
  "sftp-config.json",
  "deployment-config.json",
  "docker-compose.yml",
  "Dockerfile",
  "kubernetes.yaml",
  "helm-",
  "terraform.tfstate",
  "graphql",
  "graphiql",
  "swagger",
  "openapi.json",
  "api-docs",
  "ReportServer",
  "vpn/../",
  "dana-na/",
  "pulse/secure/",
  "/remote/login",
  "citrix/",
  "exchange/",
  "autodiscover/",
  ".vscode/sftp.json",
  ".idea/",
  "thumbs.db",
  ".htaccess",
  ".htpasswd",
];

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("session");
  return response;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isSuspiciousPath(pathname: string): boolean {
  return SUSPICIOUS_PATHS.some((pattern) =>
    pathname.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isGeneralRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = generalRateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    // Prevent map from growing too large
    if (generalRateLimit.size >= MAX_MAP_SIZE) {
      cleanupRateLimit();
    }

    generalRateLimit.set(ip, { count: 1, resetTime: now + GENERAL_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > GENERAL_MAX_REQUESTS;
}

function isApiRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = apiRateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    // Prevent map from growing too large
    if (apiRateLimit.size >= MAX_MAP_SIZE) {
      cleanupRateLimit();
    }

    apiRateLimit.set(ip, { count: 1, resetTime: now + API_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > API_MAX_REQUESTS;
}

// API call helper with timeout
async function callSecurityAPI(action: string, data: any, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXTAUTH_URL
        : "http://localhost:3000";

    if (!baseUrl) {
      throw new Error("Base URL not configured");
    }

    const response = await fetch(`${baseUrl}/api/auth/security/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Security API timeout for ${action}`);
    } else {
      console.error(`Security API call failed for ${action}:`, error);
    }

    // Return safe defaults on error
    switch (action) {
      case "checkIPBlock":
        return { blocked: false };
      case "trackSuspicious":
        return { shouldBlock: false };
      default:
        return null;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateSession(sessionToken: string) {
  try {
    const { payload } = await jose.jwtVerify(sessionToken, SECRET_KEY);
    const now = Math.floor(Date.now() / 1000);

    if (!payload || !payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const sessionToken = request.cookies.get("session")?.value;
  const userAgent = request.headers.get("user-agent") || "Unknown";

  // Skip security API calls for security endpoints to avoid loops
  if (pathname.startsWith("/api/auth/security")) {
    return NextResponse.next();
  }

  // Origin validation for state-changing methods (prevent CSRF via origin mismatch)
  // This is defense-in-depth alongside CSRF tokens
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Verify origin matches host for ALL routes
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        console.warn(
          `[Security] Origin mismatch: ${originHost} !== ${host} for ${pathname}`
        );
        return new NextResponse("CSRF Protection: Invalid Origin", {
          status: 403,
        });
      }
    }
  }

  // CSRF Protection for state-changing requests
  if (requiresCSRFValidation(request)) {
    const isValidCSRF = validateCSRFToken(request);
    if (!isValidCSRF) {
      console.warn(`[CSRF] Validation failed: ${clientIP} - ${pathname}`);
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Handle suspicious paths with API tracking
  if (isSuspiciousPath(pathname)) {
    const result = await callSecurityAPI("trackSuspicious", {
      ip: clientIP,
      path: pathname,
      userAgent,
    });

    if (result?.shouldBlock) {
      console.log(`🚨 BLOCKED: ${clientIP} - Suspicious scanning`);
      return new NextResponse("Access Denied", { status: 403 });
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // General rate limiting (in-memory)
  if (isGeneralRateLimited(clientIP)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // Stricter rate limiting for API routes
  if (pathname.startsWith("/api/") && isApiRateLimited(clientIP)) {
    console.log(`⚠️ API RATE LIMITED: ${clientIP}`);
    return new NextResponse("Too Many API Requests", { status: 429 });
  }

  // Check IP blocks via database
  const blockCheck = await callSecurityAPI("checkIPBlock", { ip: clientIP });
  if (blockCheck?.blocked) {
    console.log(`🚫 BLOCKED IP: ${clientIP} - ${blockCheck.reason}`);
    return new NextResponse(
      blockCheck.permanent
        ? "Access Permanently Denied"
        : `Access Temporarily Denied. Try again in ${blockCheck.timeLeft} minutes.`,
      { status: 403 }
    );
  }

  // Role-based access control for admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await validateSession(sessionToken);
    if (
      !payload ||
      typeof payload.role !== "string" ||
      !["SysAdmin", "Admin"].includes(payload.role)
    ) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse("Access Denied", { status: 403 });
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // Role-based access control for /admin/user-management (SysAdmin only)
  if (
    pathname.startsWith("/admin/user-management") ||
    pathname.startsWith("/api/admin/user-management")
  ) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await validateSession(sessionToken);
    if (
      !payload ||
      typeof payload.role !== "string" ||
      payload.role !== "SysAdmin"
    ) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          "User Management access restricted to SysAdmin",
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/admin-dashboard", request.url));
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSRF token to response
  addCSRFTokenToResponse(response);

  // Handle specific routes
  switch (true) {
    case pathname === "/":
      if (!sessionToken) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const rootPayload = await validateSession(sessionToken);
      if (rootPayload) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      const rootResponse = NextResponse.redirect(
        new URL("/login", request.url)
      );
      return clearAuthCookies(rootResponse);

    case pathname === "/login":
    case pathname === "/register":
    case pathname === "/forgot-password":
      if (!sessionToken) {
        return response;
      }

      const authPayload = await validateSession(sessionToken);
      if (authPayload) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      return clearAuthCookies(response);

    case pathname === "/reset-password":
      // Allow access to reset password page regardless of session status
      // The page itself validates the token from URL parameters
      return response;

    case pathname.startsWith("/api/auth/"):
      // API routes get the response with security headers
      return response;

    case pathname.startsWith("/dashboard"):
      if (!sessionToken) {
        const dashResponse = NextResponse.redirect(
          new URL("/login", request.url)
        );
        return clearAuthCookies(dashResponse);
      }

      const payload = await validateSession(sessionToken);
      if (!payload) {
        const dashResponse = NextResponse.redirect(
          new URL("/login", request.url)
        );
        return clearAuthCookies(dashResponse);
      }

      return response;

    case pathname.startsWith("/home"):
    case pathname.startsWith("/infertility"):
    case pathname.startsWith("/pathology"):
    case pathname.startsWith("/admin-dashboard"):
      if (!sessionToken) {
        const authResponse = NextResponse.redirect(
          new URL("/login", request.url)
        );
        return clearAuthCookies(authResponse);
      }

      const appPayload = await validateSession(sessionToken);
      if (!appPayload) {
        const authResponse = NextResponse.redirect(
          new URL("/login", request.url)
        );
        return clearAuthCookies(authResponse);
      }

      return response;

    default:
      return response;
  }
}

export const config = {
  runtime: "nodejs", // Use Node.js runtime for full crypto support
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.*\\.ico|mavn-logo-white.png|mi-favicon-bw-copy.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.png).*)",
  ],
};
