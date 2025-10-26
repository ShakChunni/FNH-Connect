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
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login or clear auth state
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 429) {
      // Rate limiting
      console.warn("Rate limit exceeded. Please wait before trying again.");
    }

    return Promise.reject(error);
  }
);

export default api;
