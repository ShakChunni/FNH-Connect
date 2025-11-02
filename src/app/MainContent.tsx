"use client";
import { useAuth } from "./AuthContext";
import LoadingState from "./LoadingState";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const pathname = usePathname(); // ✅ Use Next.js hook instead of window.location
  const [mounted, setMounted] = useState(false);

  // ✅ Wait for client hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Show loading during hydration
  if (!mounted) {
    return null; // or return a static loading skeleton
  }

  const isLoginPage = pathname.startsWith("/login");

  // ✅ Auth pages: Check session FIRST before rendering
  // This prevents race condition where client renders before middleware redirect
  if (isLoginPage) {
    // If still loading, show nothing (wait for session check)
    if (loading) {
      return <LoadingState type="authenticating" />;
    }

    // If user exists, show loading while middleware redirects to /dashboard
    if (user) {
      return <LoadingState type="authenticating" />;
    }

    // No user = render login page
    return <main>{children}</main>;
  }

  // ✅ Protected pages: show loading while checking auth
  if (loading) {
    return <LoadingState type="authenticating" />;
  }

  // ✅ Protected pages: user authenticated, show content
  if (user) {
    return <main>{children}</main>;
  }

  // ✅ Protected pages: no user, middleware will redirect
  // Show loading to prevent flash of wrong content
  return <LoadingState type="authenticating" />;
}
