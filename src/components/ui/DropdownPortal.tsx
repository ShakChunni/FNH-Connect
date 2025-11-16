"use client";

import { ReactNode, useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDynamicDropdownPosition } from "@/hooks/use-dynamic-dropdown-position";
import type { DropdownPortalProps } from "../../types/dropdownPortal";

export function DropdownPortal({
  isOpen,
  onClose,
  buttonRef,
  children,
  className = "",
}: DropdownPortalProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Hook for dynamic positioning and outside scroll handling
  const { positionStyle, animationDirection } = useDynamicDropdownPosition(
    isOpen,
    buttonRef,
    dropdownRef,
    onClose
  );

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  // Animation variants for dynamic direction
  const animationVariants = {
    hidden: (direction: "up" | "down") => ({
      opacity: 0,
      y: direction === "down" ? -10 : 10,
      scale: 0.97,
    }),
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
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
          exit="hidden"
          transition={{
            duration: 0.25,
            ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing for smooth bounce
          }}
          style={positionStyle}
          className={`bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden ${className}`}
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
