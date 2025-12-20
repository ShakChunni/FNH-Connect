"use client";

import { motion, Variants } from "framer-motion";

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10, // Slight slide up
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      mass: 0.8,
      opacity: { duration: 0.2, ease: "easeOut" },
      filter: { duration: 0.2, ease: "easeOut" },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    filter: "blur(4px)",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    // FIX: Set the target background color immediately in the hidden state.
    // Since opacity is 0, it remains invisible, but this prevents the browser
    // from interpolating "transparent" -> "rgba(0,0,0,0.2)" which causes the snap.
    background: "rgba(0, 0, 0, 0.2)",
  },
  visible: {
    opacity: 1,
    backdropFilter: "blur(4px)",
    background: "rgba(0, 0, 0, 0.2)",
    willChange: "opacity, backdrop-filter",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    background: "rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
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
