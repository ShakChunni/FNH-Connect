"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import type { PortalType } from "@/types/auth";

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
  portal?: PortalType;
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
  portal,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Modernized input styles - cleaner border, subtle shadow
  const getInputClassName = () => {
    const focusRingColor = portal === "infertility" 
      ? "focus:ring-emerald-500/20 focus:border-emerald-500" 
      : "focus:ring-blue-500/20 focus:border-blue-500";

    // Solid white background with dark text for maximum readability
    const base =
      `w-full px-4 py-3.5 pr-12 rounded-xl border bg-white text-sm text-slate-900 placeholder-slate-400 transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out focus:outline-none focus:ring-4 shadow-sm`;

    // Error state: High visibility red border
    const errorStyles = error
      ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-500/20"
      : `border-slate-200 hover:border-slate-300 ${focusRingColor} shadow-inner`;

    const disabledStyles = disabled
      ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-75 border-slate-100"
      : "";

    return `${base} ${errorStyles} ${disabledStyles}`;
  };

  return (
    <div className="space-y-1 relative">
      <label
        htmlFor="password"
        className="block text-sm font-bold text-white/80 ml-1 uppercase tracking-wider"
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
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-[color,background-color,transform] duration-200 active:scale-95 ${
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
