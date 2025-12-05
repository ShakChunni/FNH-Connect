"use client";

import React from "react";

interface LoginLoadingProps {
  message?: string;
  size?: number; // Added size prop for flexibility
}

export function LoginLoading({
  message = "Authenticating...",
  size = 20,
}: LoginLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Simple, smooth circular spinner */}
      <svg
        className="animate-spin text-current"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        width={size}
        height={size}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {/* Optional message, hidden if inside a small button context usually, but kept for flexibility */}
      {message && <span className="font-medium animate-pulse">{message}</span>}
    </div>
  );
}
