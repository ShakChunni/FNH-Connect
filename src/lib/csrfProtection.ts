/**
 * CSRF Token Management
 * Implements double-submit cookie pattern for CSRF protection
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF token in cookie
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  // NOTE: This cookie must be readable by client-side JavaScript for the
  // double-submit pattern (the client reads the cookie and echoes it in the
  // `x-csrf-token` header). Do NOT set httpOnly here.
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from request
 */
export function getCSRFToken(request: NextRequest): {
  cookieToken: string | undefined;
  headerToken: string | undefined;
} {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME) || undefined;

  return { cookieToken, headerToken };
}

/**
 * Validate CSRF token using constant-time comparison
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const { cookieToken, headerToken } = getCSRFToken(request);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Middleware helper to add CSRF token to response
 */
export function addCSRFTokenToResponse(response: NextResponse): NextResponse {
  const existingToken = response.cookies.get(CSRF_COOKIE_NAME);

  if (!existingToken) {
    const newToken = generateCSRFToken();
    setCSRFCookie(response, newToken);
  }

  return response;
}

/**
 * Check if request requires CSRF validation
 */
export function requiresCSRFValidation(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Only validate state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return false;
  }

  // ✅ CSRF protection enabled for ALL state-changing requests
  // Previously skipped /api/auth/login and /api/auth/register - now protected!
  return true;
}

/**
 * API route helper to validate CSRF token
 */
export function validateCSRFForAPI(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  if (!requiresCSRFValidation(request)) {
    return { valid: true };
  }

  const isValid = validateCSRFToken(request);

  if (!isValid) {
    console.warn(
      "[CSRF] Token validation failed for:",
      request.nextUrl.pathname
    );
    return {
      valid: false,
      error: "CSRF token validation failed",
    };
  }

  return { valid: true };
}
