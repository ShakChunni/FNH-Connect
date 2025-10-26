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
  const [isClient, setIsClient] = useState(false);
  const [pathname, setPathname] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPathname(window.location.pathname);
    const sessionCookie = Cookies.get("session");
    setHasSession(!!sessionCookie);
  }, []);

  if (!isClient) {
    return (
      <main suppressHydrationWarning>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </main>
    );
  }

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isFirstTimeSetupPage = pathname === "/first-time-setup";
  const isForgotPasswordPage = pathname === "/forgot-password";
  const isResetPasswordPage = pathname === "/reset-password";
  const isAuthPage =
    isLoginPage ||
    isRegisterPage ||
    isFirstTimeSetupPage ||
    isForgotPasswordPage ||
    isResetPasswordPage;

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  if (loading && !hasSession) {
    return <LoadingState type="authenticating" />;
  }

  if (user || hasSession) {
    return <main>{children}</main>;
  }

  if (!isAuthPage) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return <LoadingState type="authenticating" />;
  }

  return <main>{children}</main>;
}
