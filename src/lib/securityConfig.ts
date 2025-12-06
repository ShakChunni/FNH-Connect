import crypto from "crypto";

/**
 * Security Configuration
 * Centralized security constants and utilities
 */

// Password Policy
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRATION_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS_PER_WINDOW: 3,
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  EXPIRATION_TIME: 60 * 60 * 24, // 1 day in seconds
  REFRESH_THRESHOLD: 60 * 60 * 2, // Refresh when 2 hours left
  MAX_CONCURRENT_SESSIONS: 5,
} as const;

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
  SUSPICIOUS_THRESHOLD: 3,
  SUSPICIOUS_BLOCK_DURATION: 2 * 60 * 60 * 1000, // 2 hours
  GENERAL_WINDOW: 15 * 60 * 1000,
  GENERAL_MAX_REQUESTS: 500,
  API_WINDOW: 1 * 60 * 1000,
  API_MAX_REQUESTS: 30,
} as const;

// Generic Error Messages (prevent user enumeration)
export const GENERIC_ERRORS = {
  INVALID_CREDENTIALS: "Invalid credentials. Please try again.",
  ACCOUNT_ISSUE: "Unable to process request. Please contact support.",
  REGISTRATION_FAILED:
    "Registration could not be completed. Please verify your details or contact HR.",
  OTP_INVALID: "Invalid or expired verification code. Please try again.",
  RATE_LIMITED: "Too many attempts. Please try again later.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "Unauthorized access.",
  FORBIDDEN: "Access denied.",
  EMPLOYEE_NOT_FOUND: "Employee ID not found. Please contact HR.",
  EMAIL_MISMATCH:
    "Email address does not match our records. Please contact HR.",
  ACCOUNT_ALREADY_REGISTERED:
    "Account already has a password set. Please use login instead.",
  ACCOUNT_INACTIVE: "Account is not active. Please contact HR.",
  ACCOUNT_NOT_REGISTERED:
    "Account not fully registered. Please complete registration first.",
} as const;

// Security Headers Configuration
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
} as const;

/**
 * Validate password against security policy
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long`
    );
  }

  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_POLICY.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_POLICY.SPECIAL_CHARS.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}]`
    );
    if (!specialCharsRegex.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Use for OTP verification, tokens, etc.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Sanitize error messages for client response
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Log full error server-side but return generic message
    console.error("[Security] Error:", error.message);
    return GENERIC_ERRORS.ACCOUNT_ISSUE;
  }
  return GENERIC_ERRORS.ACCOUNT_ISSUE;
}

/**
 * Generate cryptographically secure random OTP
 */
export function generateSecureOTP(length: number = OTP_CONFIG.LENGTH): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);

  let otp: number;
  do {
    const randomBytes = crypto.randomBytes(4);
    otp = randomBytes.readUInt32BE(0) % max;
  } while (otp < min);

  return otp.toString().padStart(length, "0");
}

/**
 * Check if a value contains personal information
 * (Used to prevent passwords containing personal info)
 */
export function containsPersonalInfo(
  value: string,
  personalData: {
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    email?: string;
  }
): boolean {
  const lowerValue = value.toLowerCase();

  if (
    personalData.firstName &&
    lowerValue.includes(personalData.firstName.toLowerCase())
  ) {
    return true;
  }

  if (
    personalData.lastName &&
    lowerValue.includes(personalData.lastName.toLowerCase())
  ) {
    return true;
  }

  if (
    personalData.employeeId &&
    lowerValue.includes(personalData.employeeId.toLowerCase())
  ) {
    return true;
  }

  if (personalData.email) {
    const emailPrefix = personalData.email.split("@")[0].toLowerCase();
    if (lowerValue.includes(emailPrefix)) {
      return true;
    }
  }

  return false;
}
