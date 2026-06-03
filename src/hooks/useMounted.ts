"use client";

import { useState, useEffect } from "react";

/**
 * useMounted
 *
 * Returns `true` only after the component has mounted on the client.
 * Use this to gate client-only rendering (e.g. React portals, window APIs)
 * without causing hydration mismatches.
 *
 * Why this works:
 * - Server render: returns false
 * - Initial client render (hydration): returns false (matches server)
 * - After hydration (useEffect fires): returns true
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
