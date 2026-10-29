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
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { SessionManager } from "@/lib/sessionManager";
import LoadingState from "./LoadingState";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import { getAvailablePortals, getDefaultRouteForRole } from "@/lib/roles";
import type { PortalType, SessionUser } from "@/types/auth";

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  canRedirectFromAuthPage: boolean;
  portal: import("@/types/auth").PortalType | null;
  availablePortals: PortalType[];
  isSwitchingPortal: boolean;
  login: (userData: SessionUser) => Promise<void>;
  logout: () => Promise<void>;
  switchPortal: (targetPortal: PortalType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialLoad, setInitialLoad] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [switchingPortal, setSwitchingPortal] = useState(false);
  const [switchingPortalTarget, setSwitchingPortalTarget] =
    useState<PortalType | null>(null);
  const [portal, setPortal] = useState<import("@/types/auth").PortalType | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const isLoginPath = pathname === "/login";
  const [checkedLoginPath, setCheckedLoginPath] = useState<string | null>(null);
  const [loginPathVerified, setLoginPathVerified] = useState(false);
  const sessionManager = useRef(SessionManager.getInstance());
  const authOperation = useRef(false);
  const currentPath = useRef(pathname);
  currentPath.current = pathname;

  // Improved session check with race condition prevention
  const checkSession = useCallback(
    async (force = false) => {
      let completed = false;
      try {
        if (switchingPortal || loggingOut) {
          return;
        }

        if (initialLoad && !force) {
          return;
        }

        const data = await sessionManager.current.checkSession(force);

        // Skip if this was a rate-limited check
        if (!data || authOperation.current || currentPath.current !== pathname) return;
        completed = true;

        if (isLoginPath) setLoginPathVerified(true);

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
            portal: data.user.portal,
            specialization: data.user.specialization,
            email: data.user.email,
            phoneNumber: data.user.phoneNumber,
            isActive: data.user.isActive,
          };

          setUser(validatedUser);
          setPortal(data.user.portal);
        } else {
          // Session invalid - clear everything and redirect
          console.log("[AuthContext] Session invalid, clearing state");
          setUser(null);
          setPortal(null);
          Cookies.remove("session");
          Cookies.remove("portal");
          sessionManager.current.reset();
          router.replace("/login");
        }
      } catch (error) {
        console.error("[AuthContext] Session check failed:", error);
        if (currentPath.current !== pathname) return;
        completed = true;
        if (isLoginPath) setLoginPathVerified(false);
        // Preserve the last authenticated state on transient network/server errors.
        // An initial unauthenticated load still finishes so the login screen can render.
      } finally {
        if (initialLoad) {
          setInitialLoad(false);
        }
        if (completed && isLoginPath && currentPath.current === pathname) setCheckedLoginPath(pathname);
        setLoading(false);
      }
    },
    [initialLoad, loggingOut, router, switchingPortal, isLoginPath, pathname],
  );

  // Entering login must revalidate cached context before MainContent redirects.
  // One effect handles both initial load and login navigation, including StrictMode.
  useEffect(() => {
    if (initialLoad || isLoginPath) {
      sessionManager.current.reset();
      checkSession(true);
    }
    if (!isLoginPath) {
      setCheckedLoginPath(null);
      setLoginPathVerified(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Periodic session validation (every 5 minutes) - only if user exists and not logging out
  useEffect(() => {
    // Don't start interval if logging out or no user
    if (user && !loggingOut) {
      const interval = setInterval(
        () => {
          // Double-check we're not logging out before checking session
          if (!loggingOut) {
            checkSession(false);
          }
        },
        5 * 60 * 1000,
      ); // 5 minutes

      // Ensure cleanup happens properly
      return () => {
        clearInterval(interval);
      };
    }
    // No cleanup needed if user is null or logging out
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loggingOut]); // Depend on user existence and logout state

  const login = useCallback(
    async (userData: SessionUser) => {
      try {
        setUser(userData);
        setPortal(userData.portal);
        sessionManager.current.reset(); // Reset session manager state

        // Set portal cookie for client-side middleware fallback
        Cookies.set("portal", userData.portal, { path: "/" });

        // Portal-based redirection
        if (userData.portal === "infertility") {
          router.push("/infertility");
        } else {
          router.push(getDefaultRouteForRole(userData.role, userData.portal));
        }
      } catch (error) {
        sessionManager.current.reset();
        throw error;
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    authOperation.current = true;
    setLoggingOut(true);
    try {
      await fetchWithCSRF("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setPortal(null);
      Cookies.remove("session");
      Cookies.remove("portal");
      sessionManager.current.reset();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      setUser(null);
      setPortal(null);
      Cookies.remove("session");
      Cookies.remove("portal");
      sessionManager.current.reset();
      router.replace("/login");
    } finally {
      authOperation.current = false;
      setLoggingOut(false);
    }
  }, [router]);

  const switchPortal = useCallback(
    async (targetPortal: PortalType) => {
      if (!user || targetPortal === portal) {
        return;
      }

      authOperation.current = true;
      setSwitchingPortalTarget(targetPortal);
      setSwitchingPortal(true);

      try {
        const response = await fetchWithCSRF("/api/auth/switch-portal", {
          method: "POST",
          body: JSON.stringify({ portal: targetPortal }),
        });

        const data = (await response.json()) as {
          success: boolean;
          error?: string;
          user?: SessionUser;
        };

        if (!response.ok || !data.success || !data.user) {
          throw new Error(data.error || "Failed to switch portal");
        }

        Cookies.set("portal", targetPortal, { path: "/" });
        sessionManager.current.reset();
        window.location.replace(
          getDefaultRouteForRole(data.user.role, data.user.portal),
        );
      } catch (error) {
        console.error("[AuthContext] Portal switch failed:", error);
        authOperation.current = false;
        setSwitchingPortalTarget(null);
        setSwitchingPortal(false);
        throw error;
      }
    },
    [portal, user],
  );

  const availablePortals = user ? getAvailablePortals(user.role) : [];

  // Show LoadingState component only during logout
  if (loggingOut) {
    return (
      <LoadingState
        type="logout"
        portal={portal ?? user?.portal ?? "general"}
      />
    );
  }

  if (switchingPortal) {
    return (
      <LoadingState
        type="switching"
        portal={switchingPortalTarget ?? portal ?? user?.portal ?? "general"}
      />
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || (isLoginPath && checkedLoginPath !== pathname),
        canRedirectFromAuthPage: !isLoginPath || (checkedLoginPath === pathname && loginPathVerified),
        portal,
        availablePortals,
        isSwitchingPortal: switchingPortal,
        login,
        logout,
        switchPortal,
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
