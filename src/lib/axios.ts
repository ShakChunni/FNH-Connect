import axios from "axios";

/**
 * Get a cookie value by name
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

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Request interceptor to add CSRF token and auth token
api.interceptors.request.use(
  (config) => {
    // Add CSRF token for state-changing requests
    if (
      config.method &&
      ["post", "put", "delete", "patch"].includes(config.method.toLowerCase())
    ) {
      const csrfToken = getCookie("csrf-token");
      if (csrfToken && config.headers) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }

    // Note: We use httpOnly session cookies, not localStorage tokens
    // This is more secure and prevents XSS attacks from stealing sessions

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    // IMPORTANT: Do NOT redirect here! The AuthContext handles session verification
    // and redirects via Next.js router. Using window.location.href here causes a
    // race condition with AuthContext's router.push/replace, leading to loading loops.
    // Just reject the promise and let the calling code handle it.
    if (error.response?.status === 401) {
      // Log for debugging but don't redirect
      console.warn(
        "[Axios] 401 Unauthorized - AuthContext will handle redirect"
      );
    }

    if (error.response?.status === 429) {
      // Rate limiting
      console.warn("Rate limit exceeded. Please wait before trying again.");
    }

    return Promise.reject(error);
  }
);

export default api;
