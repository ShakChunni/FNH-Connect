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

  const getInputClassName = () => {
    const base =
      "w-full px-4 py-3.5 pr-12 rounded-xl border-2 text-sm text-fnh-navy placeholder-fnh-grey/60 transition-all duration-300 ease-out focus:outline-none";
    const errorStyles = error
      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-fnh-grey-light/50 bg-white focus:border-fnh-blue focus:ring-2 focus:ring-fnh-blue/10 hover:border-fnh-grey";
    const disabledStyles = disabled
      ? "bg-fnh-porcelain text-fnh-grey cursor-not-allowed opacity-60"
      : "";
    const focusedStyles =
      isFocused && !error ? "border-fnh-blue shadow-sm" : "";

    return `${base} ${errorStyles} ${disabledStyles} ${focusedStyles}`;
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="password"
        className="block text-sm font-medium text-fnh-navy/80"
      >
        Password
      </label>
      <div className="relative">
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
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
            error
              ? "text-red-400 hover:text-red-500 hover:bg-red-50"
              : "text-fnh-grey hover:text-fnh-navy hover:bg-fnh-grey-light/30"
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

      {/* Smooth Field Error Animation */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-500 font-medium pl-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
