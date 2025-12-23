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

      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
      }
    },
    [touched, validateField]
  );

  const handleFieldBlur = useCallback(
    (field: keyof LoginFormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setFocusedField(null);
      const error = validateField(field, formData[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    },
    [formData, validateField]
  );

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
    const base =
      "w-full px-4 py-3.5 rounded-xl border-2 text-sm text-fnh-navy placeholder-fnh-grey/60 transition-all duration-300 ease-out focus:outline-none";
    const errorStyles = hasError
      ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-fnh-grey-light/50 bg-white focus:border-fnh-blue focus:ring-2 focus:ring-fnh-blue/10 hover:border-fnh-grey";
    const disabledStyles = isLoading
      ? "bg-fnh-porcelain text-fnh-grey cursor-not-allowed opacity-60"
      : "";
    const focusedStyles =
      focusedField === field && !hasError ? "border-fnh-blue shadow-sm" : "";

    return `${base} ${errorStyles} ${disabledStyles} ${focusedStyles}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message - Smooth animated */}
      <LoginError
        message={submitError}
        onDismiss={() => setSubmitError(null)}
      />

      {/* Username Field */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label
          htmlFor="username"
          className="block text-sm font-medium text-fnh-navy/80"
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

        {/* Smooth Field Error */}
        <AnimatePresence mode="wait">
          {touched.username && errors.username && (
            <motion.p
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-red-500 font-medium pl-1"
            >
              {errors.username}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Password Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
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
          className="w-full h-12 px-4 bg-fnh-navy text-fnh-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-fnh-navy-light focus:ring-2 focus:ring-offset-2 focus:ring-fnh-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
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
