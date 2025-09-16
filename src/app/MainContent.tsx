"use client";
import { useAuth } from "./AuthContext";
import LoadingState from "./LoadingState";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  // FIXED: Prevent hydration mismatch with client-only check
  const [isClient, setIsClient] = useState(false);
  const [pathname, setPathname] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPathname(window.location.pathname);
    // Check if session cookie exists to avoid unnecessary loading states
    const sessionCookie = Cookies.get("session");
    setHasSession(!!sessionCookie);
  }, []);

  // FIXED: For SSR, always render the same content to prevent hydration mismatch
  if (!isClient) {
    return (
      <main suppressHydrationWarning>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </main>
    );
  }

  const isLoginPage = pathname === "/login";

  // Don't show LoadingState on login page
  if (isLoginPage) {
    return <main>{children}</main>;
  }

  // FIXED: Only show loading state if we don't have a session cookie
  // This prevents showing LoadingState for already-authenticated users
  if (loading && !hasSession) {
    return <LoadingState type="authenticating" />;
  }

  // For authenticated routes - if we have user OR session cookie, show content
  if (user || hasSession) {
    return <main>{children}</main>;
  }

  // Redirect to login if no user and not on login page
  if (!isLoginPage) {
    // Use Next.js router instead of window.location for better hydration
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return <LoadingState type="authenticating" />;
  }

  return <main>{children}</main>;
}
