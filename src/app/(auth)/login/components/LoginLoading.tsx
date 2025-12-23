"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoginLoadingProps {
  message?: string;
  size?: number;
}

export function LoginLoading({
  message = "Signing in...",
  size = 18,
}: LoginLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {/* Smooth animated spinner */}
      <motion.svg
        className="text-current"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </motion.svg>
      {message && (
        <motion.span
          className="font-medium"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {message}
        </motion.span>
      )}
    </div>
  );
}
