"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import LoadingState from "./LoadingState";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  manages: string[];
  organizations: string[];
}

interface PICUser {
  id: number;
  username: string;
  fullName?: string;
  role: string;
  roleType?: string;
  manages: string[];
  organizations: string[];
  archived: boolean;
}

interface SecurityState {
  rateLimited: boolean;
  timeLeft: number;
  attemptCount: number;
  attemptsLeft: number;
  isBlocked: boolean;
  blockReason?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  securityState: SecurityState;
  refreshSecurityState: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // PIC data
  picUsers: PICUser[];
  picLoading: boolean;
  refreshPics: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialLoad, setInitialLoad] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [securityState, setSecurityState] = useState<SecurityState>({
    rateLimited: false,
    timeLeft: 0,
    attemptCount: 0,
    attemptsLeft: 5,
    isBlocked: false,
  });

  // PIC data state
  const [picUsers, setPicUsers] = useState<PICUser[]>([]);
  const [picLoading, setPicLoading] = useState(false);

  const router = useRouter();

  // SINGLE API call to get ALL security state from database
  const refreshSecurityState = async () => {
    try {
      const response = await fetch("/api/security/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getFullSecurityState", ip: "client" }),
      });

      if (response.ok) {
        const data = await response.json();

        // Use ONLY database values
        setSecurityState({
          rateLimited: data.rateLimited || false,
          timeLeft: data.timeLeft || 0,
          attemptCount: data.attemptCount || 0,
          attemptsLeft: data.attemptsLeft || 5,
          isBlocked: data.isBlocked || false,
          blockReason: data.blockReason,
        });
      } else {
        console.error("Failed to fetch security state:", response.status);
        // Keep current state on API error
      }
    } catch (error) {
      console.error("Failed to refresh security state:", error);
      // Keep current state on network error
    }
  };

  // Fetch PIC users
  const fetchPics = async (currentUser: User) => {
    setPicLoading(true);
    try {
      const response = await fetch("/api/fetch/pics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUsername: currentUser.username,
          currentRole: currentUser.role,
          managesUsers: currentUser.manages || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PICs: ${response.status}`);
      }

      const userData: PICUser[] = await response.json();

      // Ensure fullName is properly handled
      const processedUsers = userData.map((user) => ({
        ...user,
        fullName: user.fullName || user.username, // Fallback to username if no fullName
      }));

      setPicUsers(processedUsers);
    } catch (error) {
      console.error("Failed to fetch PICs:", error);
      setPicUsers([]);
    } finally {
      setPicLoading(false);
    }
  };

  const refreshPics = async () => {
    if (user) {
      await fetchPics(user);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      // FIXED: Don't show loading for already-authenticated users checking session
      // Only show loading during initial app load or explicit authentication
      if (initialLoad) {
        setAuthenticating(true);
      }

      try {
        const res = await fetch("/api/auth/checkSession", {
          credentials: "include",
        });

        if (res.status === 401) {
          setUser(null);
          setPicUsers([]); // Clear PIC data
          Cookies.remove("session");
          if (window.location.pathname !== "/login") {
            router.push("/login");
          }
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const validatedUser = {
              id: data.user.id,
              username: data.user.username,
              fullName: data.user.fullName || "",
              role: data.user.role,
              manages: Array.isArray(data.user.manages)
                ? data.user.manages
                : [],
              organizations: Array.isArray(data.user.organizations)
                ? data.user.organizations
                : [],
            };
            setUser(validatedUser);

            // Fetch PICs after setting user
            await fetchPics(validatedUser);

            // FIXED: Only redirect from login page, don't redirect if already on correct page
            if (window.location.pathname === "/login") {
              if (validatedUser.role === "LeadsManager") {
                router.push("/admin/leads-management");
              } else {
                router.push("/home");
              }
            } else {
              // FIXED: Additional check - if LeadsManager is on wrong page, redirect them
              if (validatedUser.role === "LeadsManager") {
                const currentPath = window.location.pathname;
                const allowedPaths = ["/admin/leads-management"];
                const isOnAllowedPath = allowedPaths.some((path) =>
                  currentPath.startsWith(path)
                );

                if (!isOnAllowedPath) {
                  console.log(
                    "LeadsManager on unauthorized path, redirecting..."
                  );
                  router.push("/admin/leads-management");
                }
              }
            }
          } else {
            setUser(null);
            setPicUsers([]); // Clear PIC data
            Cookies.remove("session");
            console.log("Session cookie removed due to no user data");
            router.push("/login");
          }
        } else {
          setUser(null);
          setPicUsers([]); // Clear PIC data
          Cookies.remove("session");
          console.log("Session cookie removed due to non-ok response");
          router.push("/login");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setUser(null);
        setPicUsers([]); // Clear PIC data
        Cookies.remove("session");
        console.log("Session cookie removed due to error");
        router.push("/login");
      } finally {
        setLoading(false);
        setInitialLoad(false);
        setAuthenticating(false);
      }
    };

    checkSession();
  }, [router]);

  // Refresh security state when on login page - SINGLE API CALL
  useEffect(() => {
    if (window.location.pathname === "/login" && !loading) {
      refreshSecurityState();
    }
  }, [loading]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        // Refresh security state after failed login to get updated attempt count
        await refreshSecurityState();
        throw new Error(JSON.stringify(data));
      }

      const validatedUser = {
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
        manages: Array.isArray(data.user.manages) ? data.user.manages : [],
        organizations: Array.isArray(data.user.organizations)
          ? data.user.organizations
          : [],
      };

      setUser(validatedUser);

      // Fetch PICs after successful login
      await fetchPics(validatedUser);

      // Clear security state on successful login (reset to defaults)
      setSecurityState({
        rateLimited: false,
        timeLeft: 0,
        attemptCount: 0,
        attemptsLeft: 5,
        isBlocked: false,
      });

      // FIXED: Consistent routing - match middleware logic exactly
      if (validatedUser.role === "LeadsManager") {
        router.push("/admin/leads-management");
      } else {
        router.push("/home");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear all auth states
      setUser(null);
      setPicUsers([]); // Clear PIC data
      setAuthenticating(false);
      setLoading(false);
      setSecurityState({
        rateLimited: false,
        timeLeft: 0,
        attemptCount: 0,
        attemptsLeft: 5,
        isBlocked: false,
      });
      Cookies.remove("session");

      // First complete state updates
      await Promise.resolve();

      // Then redirect
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Reset states on error
      setLoggingOut(false);
      setAuthenticating(false);
      setLoading(false);
      window.location.href = "/login";
    }
  };

  // Show LoadingState component only during logout
  if (loggingOut) {
    return <LoadingState type="logout" />;
  }

  // FIXED: Don't show Authenticating at Provider level - let MainContent handle it
  // This prevents conflicts with server-rendered protected pages

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        securityState,
        refreshSecurityState,
        login,
        logout,
        picUsers,
        picLoading,
        refreshPics,
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
