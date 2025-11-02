"use client";

import { motion, Variants } from "framer-motion";

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 25,
    rotateX: -2,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "tween" as const,
      duration: 0.25,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 25,
    rotateX: -2,
    transition: {
      type: "tween" as const,
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: {
      type: "tween" as const,
      duration: 0.1,
      ease: "easeIn",
    },
  },
  visible: {
    opacity: 1,
    transition: {
      type: "tween" as const,
      duration: 0.18,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      type: "tween" as const,
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

export const ModalBackdrop = motion.div;

export const ModalContent = motion.div;

// Utility functions to handle body scroll locking without hiding scrollbar
export const lockBodyScroll = () => {
  // Calculate scrollbar width to prevent layout shift
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  // Lock scroll but preserve scrollbar space
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = `${scrollbarWidth}px`;
};

export const unlockBodyScroll = () => {
  // Restore normal scrolling
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
};
