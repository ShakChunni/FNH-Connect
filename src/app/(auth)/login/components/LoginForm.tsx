"use client";

import React, { useState, useCallback } from "react";
import { PasswordInput } from "./PasswordInput";
import { LoginError } from "./LoginError";
import { LoginLoading } from "./LoginLoading";
import { motion, AnimatePresence } from "framer-motion";
import {
  LOGIN_VALIDATION,
  type LoginFormData,
  type LoginFormErrors,
} from "../types";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  error = null,
}: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(error);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateField = useCallback(
    (field: keyof LoginFormData, value: string): string | undefined => {
      switch (field) {
        case "username":
          if (!value.trim()) {
            return LOGIN_VALIDATION.username.required;
          }
          if (value.length < 3) {
            return LOGIN_VALIDATION.username.minLength;
          }
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return LOGIN_VALIDATION.username.pattern;
          }
          return undefined;

        case "password":
          if (!value) {
            return LOGIN_VALIDATION.password.required;
          }
          if (value.length < 8) {
            return LOGIN_VALIDATION.password.minLength;
          }
          return undefined;

        default:
          return undefined;
      }
    },
    []
  );

  const handleFieldChange = useCallback(
    (field: keyof LoginFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSubmitError(null);
      // Clear specific field error when user types
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleFieldBlur = useCallback((field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFocusedField(null);
  }, []);

  const handleFieldFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all fields
    const newErrors: LoginFormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof LoginFormData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      setTouched({
        username: true,
        password: true,
      });
      // Set the first error as the main submit error
      const firstError = Object.values(newErrors)[0];
      setSubmitError(firstError || "Please check your inputs.");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setSubmitError(errorMessage);
    }
  };

  const getInputClassName = (
    field: "username" | "password",
    hasError: boolean
  ) => {
    // Cleaner, more modern input style
    const base =
      "w-full px-4 py-3.5 rounded-xl border bg-white/50 text-sm text-fnh-navy placeholder-fnh-grey/50 transition-all duration-300 ease-out focus:outline-none focus:bg-white";

    const errorStyles = hasError
      ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100/50"
      : "border-gray-200 hover:border-gray-300 focus:border-fnh-blue focus:ring-4 focus:ring-fnh-blue/10 shadow-sm hover:shadow-md";

    const disabledStyles = isLoading
      ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-75 border-gray-100"
      : "";

    return `${base} ${errorStyles} ${disabledStyles}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Error Message - Smooth animated */}
      <LoginError
        message={submitError}
        onDismiss={() => setSubmitError(null)}
      />

      {/* Username Field */}
      <motion.div
        className="space-y-1 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          x: touched.username && errors.username ? [0, -6, 6, -6, 6, 0] : 0,
        }}
        transition={{
          y: { duration: 0.4, delay: 0.1 },
          x: { duration: 0.4 }, // fast shake
        }}
      >
        <label
          htmlFor="username"
          className="block text-sm font-semibold text-fnh-navy/80 ml-1"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => handleFieldChange("username", e.target.value)}
          onBlur={() => handleFieldBlur("username")}
          onFocus={() => handleFieldFocus("username")}
          disabled={isLoading}
          placeholder="Enter your username"
          autoComplete="username"
          className={getInputClassName(
            "username",
            !!(touched.username && errors.username)
          )}
        />
      </motion.div>

      {/* Password Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          x: touched.password && errors.password ? [0, -6, 6, -6, 6, 0] : 0,
        }}
        transition={{
          y: { duration: 0.4, delay: 0.2 },
          x: { duration: 0.4 },
        }}
      >
        <PasswordInput
          value={formData.password}
          onChange={(value) => handleFieldChange("password", value)}
          onBlur={() => handleFieldBlur("password")}
          onFocus={() => handleFieldFocus("password")}
          error={touched.password ? errors.password : undefined}
          disabled={isLoading}
          isFocused={focusedField === "password"}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 px-4 bg-fnh-navy text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-fnh-navy-light hover:scale-[1.01] active:scale-[0.98] focus:ring-4 focus:ring-fnh-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
        >
          {isLoading ? <LoginLoading message="Signing in..." /> : "Sign In"}
        </button>
      </motion.div>

      {/* Footer Info */}
      <motion.p
        className="text-center text-xs text-fnh-grey-dark/70 pt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        For security purposes, sessions expire after 24 hours of inactivity.
      </motion.p>
    </form>
  );
}
