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
import Authenticating from "./Authenticating";
import LoggingOut from "./LoggingOut";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  manages: string[];
  organizations: string[];
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialLoad, setInitialLoad] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      setAuthenticating(true);
      try {
        const res = await fetch("/api/auth/checkSession", {
          credentials: "include",
        });

        if (res.status === 401) {
          setUser(null);
          Cookies.remove("session");
          if (window.location.pathname !== "/login") {
            await router.push("/login");
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
            if (window.location.pathname === "/login") {
              await router.push("/home");
            }
          } else {
            setUser(null);
            Cookies.remove("session");
            console.log("Session cookie removed due to no user data");
            await router.push("/login");
          }
        } else {
          setUser(null);
          Cookies.remove("session");
          console.log("Session cookie removed due to non-ok response");
          await router.push("/login");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setUser(null);
        Cookies.remove("session");
        console.log("Session cookie removed due to error");
        await router.push("/login");
      } finally {
        setLoading(false);
        setInitialLoad(false);
        setAuthenticating(false);
      }
    };

    checkSession();
  }, [router]);

  if (initialLoad || authenticating) {
    return <Authenticating />;
  }

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      // Parse the error response
      const data = await res.json();

      if (!res.ok) {
        // Throw the specific error message from the server
        throw new Error(data.error);
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
      await router.push("/home");
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw to be handled by the login page
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
      setAuthenticating(false);
      setLoading(false);
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

  // Show LoggingOut component only during logout
  if (loggingOut) {
    return <LoggingOut />;
  }

  // Show Authenticating only during initial load or authentication
  if (initialLoad || authenticating) {
    return <Authenticating />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
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
