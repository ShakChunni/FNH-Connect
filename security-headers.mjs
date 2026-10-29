// Keep config readable by Node and Edge without importing server-only crypto helpers.
export function getSecurityHeaders(production = process.env.NODE_ENV === "production") {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL, "http://localhost").origin
    : null;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${!production ? " ws: wss:" : ""}${apiOrigin && /^https?:\/\//.test(process.env.NEXT_PUBLIC_API_URL ?? "") ? ` ${apiOrigin}` : ""}`,
    // Receipts/reports open generated PDF blobs in a new tab or browser PDF viewer.
    "frame-src 'self' blob:",
    "object-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Content-Security-Policy": csp,
    ...(production ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
  };
}
