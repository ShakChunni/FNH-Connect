"use client";

import { motion, Variants } from "framer-motion";
import { DURATION, SPRING, tween } from "@/lib/motion";

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...SPRING,
      opacity: tween(DURATION.fast),
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 8,
    transition: tween(DURATION.fast),
  },
};

/**
 * Opacity only. The dim colour comes from the backdrop's className
 * (standard: `bg-slate-950/50`), so it is never overridden here.
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tween(DURATION.base) },
  exit: { opacity: 0, transition: tween(DURATION.fast) },
};

export const ModalBackdrop = motion.div;

export const ModalContent = motion.div;

// Utility functions to handle body scroll locking without creating extra scrollbar
export const lockBodyScroll = () => {
  // Store the current scroll position
  const scrollY = window.scrollY;

  // Disable scrolling completely without reserving scrollbar space
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";

  // Store scroll position for restoration
  document.body.setAttribute("data-scroll-lock-offset", scrollY.toString());
};

export const unlockBodyScroll = () => {
  // Get the stored scroll position
  const scrollY = document.body.getAttribute("data-scroll-lock-offset");

  // Restore normal scrolling
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflow = "";

  // Restore scroll position
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY, 10));
    document.body.removeAttribute("data-scroll-lock-offset");
  }
};

// Utility functions to handle body scroll locking while preserving scrollbar space
// Some modals prefer to keep the scrollbar visible to avoid layout shifts
export const preserveLockBodyScroll = () => {
  document.documentElement.style.overflowY = "scroll";
  document.body.style.overflow = "hidden";
};

export const preserveUnlockBodyScroll = () => {
  document.documentElement.style.overflowY = "";
  document.body.style.overflow = "";
};
