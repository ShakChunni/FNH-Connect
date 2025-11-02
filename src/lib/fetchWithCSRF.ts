/**
 * CSRF-Protected Fetch Wrapper
 * Automatically includes CSRF token from cookie in request headers
 * for all state-changing HTTP methods (POST, PUT, DELETE, PATCH)
 */

/**
 * Get a cookie value by name
 * @param name - Cookie name to retrieve
 * @returns Cookie value or undefined if not found
 */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }

  return undefined;
}

/**
 * Fetch wrapper that automatically includes CSRF token for state-changing requests
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch promise
 *
 * @example
 * ```typescript
 * const response = await fetchWithCSRF('/api/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ employeeId, password }),
 * });
 * ```
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || "GET";
  const headers = new Headers(options.headers);

  // Set Content-Type if not already set and we have a body
  if (
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Add CSRF token for state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrfToken = getCookie("csrf-token");

    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    } else {
      console.warn(
        "[CSRF] No CSRF token found in cookies. Request may be rejected."
      );
    }
  }

  // Ensure credentials are included to send/receive cookies
  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
}

/**
 * Alternative helper for TypeScript - explicitly typed response
 */
export async function fetchWithCSRFJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithCSRF(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Request failed",
    }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}
