"use client";

import { useEffect, useState } from "react";
import { ClientPortal } from "@/components/ui/ClientPortal";
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
  /**
   * Override the overlay's z-index. Use a value higher than the parent
   * modal's z-index when nesting a ConfirmModal inside another modal
   * (for example, set to 100100 when the parent modal is z-100000).
   */
  zIndex?: number;
  manageBodyScroll?: boolean;
}

// Helper to get icon based on variant
const getIcon = (
  variant: ConfirmModalProps["variant"] = "default",
  customIcon?: React.ReactNode
) => {
  if (customIcon) {
    return (
      <div className="flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-slate-100 shrink-0">
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
          <AlertTriangle className="h-8 w-8 text-amber-600" />
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
  zIndex,
  manageBodyScroll = true,
}: ConfirmModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  useEffect(() => {
    if (!manageBodyScroll) {
      return;
    }

    if (isOpen) {
      preserveLockBodyScroll();
    } else {
      preserveUnlockBodyScroll();
    }

    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, manageBodyScroll]);

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4 overflow-hidden"
            style={zIndex !== undefined ? { zIndex } : undefined}
          >
            <motion.div
              className="fixed inset-0 bg-slate-950/50"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleClose}
            />

            <motion.div
              role="alertdialog"
              aria-modal="true"
              className="relative w-full max-w-[420px] max-h-[calc(100dvh-1.5rem)] shadow-xl flex flex-col overflow-y-auto bg-white"
              style={{ borderRadius: "28px" }}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleClose}
                disabled={isLoading}
                aria-label="Close"
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5 text-slate-500" />
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
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <div className="text-slate-600 leading-relaxed text-sm max-w-[95%] mx-auto">
                  {children}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex w-full items-center gap-3">
                <Button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors duration-150 text-sm"
                >
                  {cancelLabel}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 h-11 font-semibold rounded-xl transition-colors duration-150 text-sm text-white border-none ${
                    variant === "destructive" || variant === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-fnh-navy hover:bg-fnh-navy-dark"
                  }`}
                >
                  {isLoading ? "Processing..." : confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </ClientPortal>
  );
}

export default ConfirmModal;
