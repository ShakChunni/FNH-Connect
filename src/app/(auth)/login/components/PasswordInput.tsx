"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
  /** Prefixes the input and label ids so the form can be mounted more than once. */
  idPrefix?: string;
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
  idPrefix = "",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = `${idPrefix}password`;

  const getInputClassName = () => {
    const focusRingColor = portal === "infertility"
      ? "focus:ring-emerald-500/20 focus:border-emerald-500"
      : "focus:ring-blue-500/20 focus:border-blue-500";

    // Solid white background with dark text for maximum readability
    const base =
      "w-full px-4 py-3.5 pr-12 rounded-xl border bg-white text-sm text-slate-900 placeholder-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-4 shadow-sm";

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
        htmlFor={inputId}
        className="block text-sm font-bold text-white/80 ml-1 uppercase tracking-wider"
      >
        Password
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id={inputId}
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
          className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
            error
              ? "text-red-600 hover:text-red-700 hover:bg-red-100"
              : "text-slate-500 hover:text-fnh-blue hover:bg-blue-50"
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
