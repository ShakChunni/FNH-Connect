"use client";

import React from "react";
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
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-slide-in-from-top">
      <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 transition-colors hover:scale-110 active:scale-95 duration-200"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
