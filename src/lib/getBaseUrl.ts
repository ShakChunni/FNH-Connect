/**
 * Get the base URL for the application based on environment
 * This ensures that production uses the production URL and local development uses localhost
 */
export function getBaseUrl(): string {
  // If NEXTAUTH_URL is set, use it - but only if it looks correct for the current environment
  const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");

  if (nextAuthUrl) {
    // If we're running in development (NODE_ENV=development or localhost)
    if (process.env.NODE_ENV === "development") {
      // In development, always use localhost
      return "http://localhost:3000";
    }

    // If we're running in production (NODE_ENV=production)
    if (process.env.NODE_ENV === "production") {
      // In production, always use the NEXTAUTH_URL
      return nextAuthUrl;
    }

    // If NODE_ENV is not set (edge case), use NEXTAUTH_URL but ensure it's not localhost
    if (
      !nextAuthUrl.includes("localhost") &&
      !nextAuthUrl.includes("127.0.0.1")
    ) {
      return nextAuthUrl;
    }
  }

  // Fallback: use environment-appropriate default
  if (process.env.NODE_ENV === "production") {
    // This should never happen in production if NEXTAUTH_URL is set properly
    throw new Error(
      "NEXTAUTH_URL is not configured for production environment"
    );
  }

  // Default for development
  return "http://localhost:3000";
}

/**
 * Get the base URL with optional path
 * Example: getBaseUrlWithPath('/reset-password?token=abc') => 'http://localhost:3000/reset-password?token=abc'
 */
export function getBaseUrlWithPath(path: string = ""): string {
  const baseUrl = getBaseUrl();
  // Remove leading slash from path if it exists to avoid double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get the base URL from request headers (useful for API routes)
 * This is more reliable than relying solely on environment variables
 */
export function getBaseUrlFromRequest(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-proto");
  const proto = forwarded ? forwarded.split(",")[0] : "http";
  const host = headers.get("x-forwarded-host") || headers.get("host");

  if (host) {
    return `${proto}://${host}`;
  }

  // Fallback to getBaseUrl
  return getBaseUrl();
}
