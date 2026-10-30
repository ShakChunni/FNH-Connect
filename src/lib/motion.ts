import type { Transition } from "framer-motion";

/**
 * Shared motion values. Keep UI motion short and calm: staff repeat the same
 * actions all day, so nothing should bounce, stagger, or take longer than ~250ms.
 */
export const DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.25,
} as const;

/** Matches the `ease-standard` CSS token in globals.css. */
export const EASE: [number, number, number, number] = [0.2, 0, 0, 1];

export const tween = (duration: number = DURATION.base): Transition => ({
  duration,
  ease: EASE,
});

/** Critically damped spring: settles quickly with no visible bounce. */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 36,
  mass: 0.8,
};

/** Side drawers (filters, mobile nav). */
export const DRAWER_TRANSITION: Transition = tween(DURATION.slow);

/** Table rows / line items: fade only, no layout shifting or stagger. */
export const rowVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tween(DURATION.fast) },
  exit: { opacity: 0, transition: tween(DURATION.fast) },
};
