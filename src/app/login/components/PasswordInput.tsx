"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

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
      <div className="relative">
        <motion.input
          type={showPassword ? "text" : "password"}
          id="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          whileFocus={{ scale: 1.01 }}
          className={`w-full px-4 py-3 pr-12 rounded-lg border-2 text-fnh-navy placeholder-fnh-grey transition-all duration-200 focus:outline-none ${
            error
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              : "border-fnh-grey-light bg-white focus:ring-2 focus:ring-fnh-blue-light/20 focus:border-fnh-blue"
          } ${
            disabled ? "bg-fnh-porcelain text-fnh-grey cursor-not-allowed" : ""
          }`}
        />
        <motion.button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className={`absolute inset-y-0 right-0 px-3 py-2 flex items-center justify-center transition-colors ${
            error
              ? "text-red-500 hover:text-red-600"
              : "text-fnh-blue hover:text-fnh-navy"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <FaEyeSlash className="w-5 h-5" />
          ) : (
            <FaEye className="w-5 h-5" />
          )}
        </motion.button>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
