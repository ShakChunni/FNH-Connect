"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import LoadingState from "./LoadingState";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { SessionUser } from "@/types/auth";

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (userData: SessionUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session check manager to prevent race conditions
class SessionManager {
  private static instance: SessionManager;
  private checkPromise: Promise<any> | null = null;
  private lastCheckTime = 0;
  private readonly CHECK_INTERVAL = 5000; // 5 seconds minimum between checks

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async checkSession(force = false): Promise<any> {
    const now = Date.now();

    // If we have a check in progress and this isn't forced, return that promise
    if (this.checkPromise && !force) {
      return this.checkPromise;
    }

    // If we just checked recently and this isn't forced, skip
    if (!force && now - this.lastCheckTime < this.CHECK_INTERVAL) {
      return null;
    }

    // Create new check promise
    this.checkPromise = this.performCheck();
    this.lastCheckTime = now;

    try {
      const result = await this.checkPromise;
      return result;
    } finally {
      // Clear the promise after completion
      this.checkPromise = null;
    }
  }

  private async performCheck() {
    const res = await fetch("/api/auth/verify-session", {
      credentials: "include",
      cache: "no-cache", // Prevent caching
    });

    if (!res.ok) {
      throw new Error(`Session check failed: ${res.status}`);
    }

    return res.json();
  }

  reset() {
    this.checkPromise = null;
    this.lastCheckTime = 0;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialLoad, setInitialLoad] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const sessionManager = useRef(SessionManager.getInstance());

  // Improved session check with race condition prevention
  const checkSession = useCallback(
    async (force = false) => {
      try {
        if (initialLoad && !force) {
          return;
        }

        const data = await sessionManager.current.checkSession(force);

        // Skip if this was a rate-limited check
        if (!data) return;

        if (data.success && data.valid && data.user) {
          const validatedUser: SessionUser = {
            id: data.user.id,
            username: data.user.username,
            staffId: data.user.staffId,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            fullName: data.user.fullName,
            role: data.user.role,
            staffRole: data.user.staffRole,
            specialization: data.user.specialization,
            email: data.user.email,
            phoneNumber: data.user.phoneNumber,
            isActive: data.user.isActive,
          };

          setUser(validatedUser);
        } else {
          setUser(null);
          Cookies.remove("session");
          sessionManager.current.reset();
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setUser(null);
        Cookies.remove("session");
        sessionManager.current.reset();
        // ✅ Middleware handles redirects, no client-side redirect needed
      } finally {
        if (initialLoad) {
          setInitialLoad(false);
        }
        setLoading(false);
      }
    },
    [initialLoad, router]
  );

  // Initial session check - only run once on mount
  useEffect(() => {
    checkSession(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Periodic session validation (every 5 minutes) - only if user exists
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        checkSession(false);
      }, 5 * 60 * 1000); // 5 minutes

      // FIXED: Ensure cleanup happens properly
      return () => {
        clearInterval(interval);
      };
    }
    // FIXED: No need for cleanup if user is null
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user existence

  const login = useCallback(
    async (userData: SessionUser) => {
      try {
        setUser(userData);
        sessionManager.current.reset(); // Reset session manager state
        router.push("/dashboard");
      } catch (error) {
        sessionManager.current.reset();
        throw error;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetchWithCSRF("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
      Cookies.remove("session");
      sessionManager.current.reset();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      setUser(null);
      Cookies.remove("session");
      sessionManager.current.reset();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  }, [router]);

  // Show LoadingState component only during logout
  if (loggingOut) {
    return <LoadingState type="logout" />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
