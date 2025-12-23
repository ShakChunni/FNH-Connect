"use client";

import React from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-600 backdrop-blur-sm">
            <FiAlertCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1 font-medium">{message}</p>
            {onDismiss && (
              <motion.button
                onClick={onDismiss}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-red-100"
                aria-label="Dismiss error"
              >
                <FiX className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
