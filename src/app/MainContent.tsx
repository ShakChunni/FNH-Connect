"use client";
import { useAuth } from "./AuthContext";
import LoadingState from "./LoadingState";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDefaultRouteForRole } from "@/lib/roles";
import type { PortalType } from "@/types/auth";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, portal, isSwitchingPortal } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const loadingPortal: PortalType =
    portal ??
    user?.portal ??
    (pathname.startsWith("/infertility") ? "infertility" : "general");

  // Use state instead of refs/globals to track hydration
  // Start with false to match server render
  const [hasHydrated, setHasHydrated] = useState(false);
  const [initialAuthCompleted, setInitialAuthCompleted] = useState(false);

  // Mark as hydrated after first client render
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Track when initial auth check completes
  useEffect(() => {
    if (hasHydrated && !loading && !initialAuthCompleted) {
      setInitialAuthCompleted(true);
    }
  }, [hasHydrated, loading, initialAuthCompleted]);

  // Determine page types
  const isPublicAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isProtectedRoute = !isPublicAuthPage && pathname !== "/";
  const authenticatedHomePath = user
    ? getDefaultRouteForRole(user.role, user.portal)
    : "/dashboard";

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (
      hasHydrated &&
      !loading &&
      !isSwitchingPortal &&
      user &&
      isPublicAuthPage
    ) {
      router.replace(authenticatedHomePath);
    }
  }, [
    hasHydrated,
    loading,
    isSwitchingPortal,
    user,
    isPublicAuthPage,
    router,
    authenticatedHomePath,
  ]);

  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (
      hasHydrated &&
      !loading &&
      !isSwitchingPortal &&
      !user &&
      isProtectedRoute
    ) {
      console.log("[MainContent] Session invalid, redirecting to login");
      router.replace("/login");
    }
  }, [hasHydrated, loading, isSwitchingPortal, user, isProtectedRoute, router]);

  // Show loading only during initial hydration/auth
  // Use suppressHydrationWarning on the container to prevent mismatch warnings
  if (!hasHydrated) {
    return <LoadingState type="loading" portal={loadingPortal} />;
  }

  const showInitialLoading = loading && !initialAuthCompleted;
  if (showInitialLoading) {
    return <LoadingState type="authenticating" portal={loadingPortal} />;
  }

  if (isSwitchingPortal) {
    return <LoadingState type="switching" portal={loadingPortal} />;
  }

  // Authenticated user on auth page - show loading while redirecting
  if (isPublicAuthPage && user) {
    return <LoadingState type="authenticating" portal={loadingPortal} />;
  }

  // Unauthenticated user on protected route - show loading while redirecting
  if (isProtectedRoute && !user) {
    return <LoadingState type="authenticating" portal={loadingPortal} />;
  }

  // Always render children - layouts handle the shell
  // Don't wrap in <main> - route-specific shells provide their own main element
  return <>{children}</>;
}
