"use client";
import { useAuth } from "./AuthContext";
import Authenticating from "./Authenticating";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const isLoginPage = pathname === "/login";

  // Don't show Authenticating on login page
  if (isLoginPage) {
    return <main>{children}</main>;
  }

  // Show Authenticating only when loading and not on login page
  if (loading) {
    return <Authenticating />;
  }

  // For authenticated routes
  if (user) {
    return <main>{children}</main>;
  }

  // Redirect to login if no user and not on login page
  if (!isLoginPage) {
    window.location.href = "/login";
    return null;
  }

  return <main>{children}</main>;
}
