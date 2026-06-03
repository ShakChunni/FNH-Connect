"use client";

import { useState, useEffect } from "react";

/**
 * useIsMobile
 *
 * Returns `true` when the viewport width is below the given breakpoint.
 * Defaults to 640px (Tailwind's sm breakpoint).
 *
 * Safe for SSR: starts as `false` on both server and initial client render,
 * then updates after hydration via a resize listener.
 *
 * Use this instead of `typeof window !== "undefined" && window.innerWidth < X`
 * in JSX to avoid hydration mismatches.
 */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
