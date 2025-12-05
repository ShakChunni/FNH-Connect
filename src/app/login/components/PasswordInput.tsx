"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export function PasswordInput({
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Enter your password",
  disabled = false,
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label
        htmlFor="password"
        className="block text-sm font-medium text-fnh-navy"
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
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border-2 text-sm sm:text-base text-fnh-navy placeholder-fnh-grey transition-colors duration-200 focus:outline-none ${
            error
              ? "border-red-500 bg-red-50 focus:border-red-500"
              : "border-fnh-grey-light bg-white focus:border-fnh-blue hover:border-fnh-blue-light"
          } ${
            disabled ? "bg-fnh-porcelain text-fnh-grey cursor-not-allowed" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={`absolute inset-y-0 right-0 px-3 py-2 flex items-center justify-center transition-colors duration-200 ${
            error
              ? "text-red-500 hover:text-red-600"
              : "text-fnh-blue hover:text-fnh-navy"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <FaEyeSlash className="w-5 h-5" />
          ) : (
            <FaEye className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Smooth Error Reveal */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          error
            ? "grid-rows-[1fr] opacity-100 mt-1"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    </div>
  );
}
