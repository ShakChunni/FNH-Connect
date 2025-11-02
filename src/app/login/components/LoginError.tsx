"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";

interface LoginErrorProps {
  message: string | null;
  onDismiss?: () => void;
}

export function LoginError({ message, onDismiss }: LoginErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
      >
        <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        {onDismiss && (
          <motion.button
            onClick={onDismiss}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label="Dismiss error"
          >
            ✕
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
