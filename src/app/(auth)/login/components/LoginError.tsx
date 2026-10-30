"use client";

import React from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { tween } from "@/lib/motion";

interface LoginErrorProps {
  message: string | null;
  onDismiss?: () => void;
}

export function LoginError({ message, onDismiss }: LoginErrorProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={tween()}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            <FiAlertCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1 font-medium">{message}</p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-100 cursor-pointer"
                aria-label="Dismiss error"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
