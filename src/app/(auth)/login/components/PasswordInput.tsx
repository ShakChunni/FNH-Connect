"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  isFocused?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  placeholder = "Enter your password",
  disabled = false,
  autoComplete = "current-password",
  isFocused = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Modernized input styles - cleaner border, subtle shadow
  const getInputClassName = () => {
    const base =
      "w-full px-4 py-3.5 pr-12 rounded-xl border bg-white/50 text-sm text-fnh-navy placeholder-fnh-grey/50 transition-all duration-300 ease-out focus:outline-none focus:bg-white";

    // Error state: Red tint, red border
    const errorStyles = error
      ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100/50"
      : "border-gray-200 hover:border-gray-300 focus:border-fnh-blue focus:ring-4 focus:ring-fnh-blue/10 shadow-sm hover:shadow-md";

    const disabledStyles = disabled
      ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-75 border-gray-100"
      : "";

    // Remove separate focusedStyles as they are handled in base/error logic now
    // but we can keep the logic if needed for external control,
    // though CSS :focus is usually snappier.

    return `${base} ${errorStyles} ${disabledStyles}`;
  };

  return (
    <div className="space-y-1 relative">
      <label
        htmlFor="password"
        className="block text-sm font-semibold text-fnh-navy/80 ml-1"
      >
        Password
      </label>
      <div className="relative group">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={getInputClassName()}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 active:scale-95 ${
            error
              ? "text-red-400 hover:text-red-500 hover:bg-red-50"
              : "text-gray-400 hover:text-fnh-blue hover:bg-blue-50"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <FaEyeSlash className="w-4 h-4" />
          ) : (
            <FaEye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
