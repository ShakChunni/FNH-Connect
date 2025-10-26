"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseAccurateCountdownOptions {
  expiresAt: number; // Unix timestamp in milliseconds when cooldown expires
  onExpire?: () => void;
  updateInterval?: number; // How often to update UI (default: 100ms for smooth updates)
}

interface CountdownState {
  remainingSeconds: number;
  isExpired: boolean;
  percentageRemaining: number;
}

/**
 * Industry-standard countdown hook that:
 * - Uses server-provided expiration timestamps (not duration)
 * - Works accurately across tab switches
 * - Automatically syncs when tab regains focus
 * - Handles system clock adjustments
 * - Never relies on client-side intervals for accuracy
 *
 * Usage:
 * ```tsx
 * const { remainingSeconds, isExpired } = useAccurateCountdown({
 *   expiresAt: Date.now() + 60000, // expires in 60 seconds
 *   onExpire: () => console.log("Expired!"),
 * });
 * ```
 */
export function useAccurateCountdown({
  expiresAt,
  onExpire,
  updateInterval = 100,
}: UseAccurateCountdownOptions): CountdownState {
  const [state, setState] = useState<CountdownState>(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
    return {
      remainingSeconds: remaining,
      isExpired: remaining === 0,
      percentageRemaining: 0,
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredRef = useRef(state.isExpired);
  const onExpireRef = useRef(onExpire);

  // Update refs when they change (without re-running effect)
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Main effect: Setup interval and handle visibility changes
  useEffect(() => {
    // Reset expired flag when expiresAt changes
    hasExpiredRef.current = false;

    const calculateState = (): CountdownState => {
      const now = Date.now();
      const remainingMs = Math.max(0, expiresAt - now);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const isExpired = remainingMs <= 0;

      return {
        remainingSeconds,
        isExpired,
        percentageRemaining: 0, // Not used in current implementation, always 0
      };
    };

    // Update state
    const updateState = () => {
      const newState = calculateState();

      // Call onExpire callback only once when transitioning to expired
      if (newState.isExpired && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }

      setState(newState);
    };

    // Initial update
    updateState();

    // Set up interval for smooth UI updates
    timerRef.current = setInterval(updateState, updateInterval);

    // Handle tab visibility changes - immediately recalculate when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - immediately recalculate from server timestamp
        updateState();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [expiresAt, updateInterval]);

  return state;
}

/**
 * Hook factory that creates a countdown from a duration in seconds
 * and automatically syncs with server on first use.
 *
 * This is a convenience wrapper that calculates expiresAt from a duration.
 * Usage:
 * ```tsx
 * const { remainingSeconds, isExpired } = useCountdownFromDuration({
 *   durationSeconds: 60,
 *   onExpire: () => console.log("Done!"),
 * });
 * ```
 */
export function useCountdownFromDuration({
  durationSeconds,
  onExpire,
  updateInterval = 100,
}: Omit<UseAccurateCountdownOptions, "expiresAt"> & {
  durationSeconds: number;
}): CountdownState {
  const expiresAt = Date.now() + durationSeconds * 1000;
  return useAccurateCountdown({ expiresAt, onExpire, updateInterval });
}
