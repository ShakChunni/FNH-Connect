"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDynamicDropdownPosition } from "@/hooks/use-dynamic-dropdown-position";
import type { DropdownPortalProps } from "../../types/dropdownPortal";

/**
 * DropdownPortal - Renders dropdown content as a portal to document.body
 *
 * Features:
 * - Dynamic positioning (above/below based on available space)
 * - Closes on outside click
 * - Closes on outside scroll
 * - Smooth animations
 *
 * Uses refs for callbacks to prevent effect re-runs with inline functions.
 */
export function DropdownPortal({
  isOpen,
  onClose,
  buttonRef,
  children,
  className = "",
  matchButtonWidth = true,
  withContainerStyles = true,
}: DropdownPortalProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Store onClose in a ref so it doesn't trigger effect re-runs
  // This allows consumers to pass inline functions like `onClose={() => setIsOpen(false)}`
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Hook for dynamic positioning and outside scroll handling
  const { positionStyle, animationDirection } = useDynamicDropdownPosition(
    isOpen,
    buttonRef,
    dropdownRef,
    onClose,
    matchButtonWidth,
  );

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        // Use the ref to always call the latest onClose
        onCloseRef.current();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, buttonRef]); // Note: onClose removed - we use the ref instead

  // Animation variants for dynamic direction
  const animationVariants = {
    hidden: (direction: "up" | "down") => ({
      opacity: 0,
      y: direction === "down" ? -6 : 6,
      scale: 0.96,
    }),
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.98,
    },
  };

  // Dropdown content with refined animation
  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          custom={animationDirection}
          variants={animationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            type: "spring",
            damping: 28,
            stiffness: 320,
            mass: 1,
          }}
          // ensure portal dropdowns in modals are always above the popup overlay
          // set a high zIndex inline so that it overrides any parent stacking context
          style={{ ...positionStyle, zIndex: 110000 }}
          className={`${withContainerStyles ? "bg-white border border-gray-200/60 rounded-xl shadow-xl shadow-fnh-navy/5 overflow-hidden ring-1 ring-black/5" : "origin-top"} ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {mounted &&
        typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
