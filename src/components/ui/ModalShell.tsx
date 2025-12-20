"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // To allow custom width/height/rounding if needed
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  children,
  className = "w-full max-w-5xl h-[80%] md:h-[90%] rounded-3xl", // Default consistent with confirm but larger
}) => {
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen]);

  // Use portal for z-index safety
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop with blur - matching ConfirmModal variants */}
          <motion.div
            className="fixed inset-0 bg-[#09090b]/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className={`relative bg-white shadow-2xl flex flex-col overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
