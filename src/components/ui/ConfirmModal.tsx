"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Ban, CheckCircle, Info, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "delete"
    | "warning"
    | "success"
    | "info";
}

// Helper to get icon based on variant
const getIcon = (
  variant: ConfirmModalProps["variant"] = "default",
  customIcon?: React.ReactNode
) => {
  if (customIcon) {
    return (
      <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-jd-porcelain shrink-0">
        {customIcon}
      </div>
    );
  }

  switch (variant) {
    case "destructive":
      return (
        <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-red-50 shrink-0">
          <Ban className="h-8 w-8 text-red-600" />
        </div>
      );
    case "delete":
      return (
        <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-red-50 shrink-0">
          <Trash2 className="h-8 w-8 text-red-600" />
        </div>
      );
    case "success":
      return (
        <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-green-50 shrink-0">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      );
    case "info":
      return (
        <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-blue-50 shrink-0">
          <Info className="h-8 w-8 text-blue-600" />
        </div>
      );
    case "warning":
    case "default":
    default:
      return (
        <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-amber-50 shrink-0">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
      );
  }
};

export function ConfirmModal({
  isOpen,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onClose,
  onConfirm,
  isLoading = false,
  variant = "default",
  icon,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      preserveLockBodyScroll();
    } else {
      preserveUnlockBodyScroll();
    }

    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-hidden">
          <motion.div
            className="fixed inset-0 bg-[#09090b]/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-[420px] shadow-2xl flex flex-col overflow-hidden bg-white"
            style={{
              borderRadius: "28px",
            }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center px-6 pb-6 pt-10 sm:px-8 sm:pb-8 sm:pt-12 text-center">
              {/* Dynamic Icon */}
              <div className="mb-5 transform scale-90 sm:scale-100">
                {getIcon(variant, icon)}
              </div>

              {/* Title & Children */}
              <div className="w-full space-y-2 mb-8">
                <h3 className="text-base sm:text-lg font-bold text-[#231F20] tracking-tight font-sans">
                  {title}
                </h3>
                <div className="text-[#888888] leading-relaxed text-xs sm:text-[13px] max-w-[95%] mx-auto">
                  {children}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex w-full items-center gap-3">
                <Button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-white border border-[#E0E0E0] hover:bg-gray-50 text-[#666666] font-semibold py-2.5 h-auto rounded-xl transition-all duration-200 text-xs shadow-sm"
                >
                  {cancelLabel}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 font-bold py-2.5 h-auto rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-xs text-white border-none ${
                    variant === "destructive" || variant === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#000000] hover:bg-[#231F20]"
                  }`}
                >
                  {isLoading ? "Processing..." : confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default ConfirmModal;
