"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PasswordInput } from "./PasswordInput";
import { LoginError } from "./LoginError";
import { LoginLoading } from "./LoginLoading";
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
          if (!/^[a-zA-Z0-9_]+$/.test(value)) {
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
      const error = validateField(field, formData[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    },
    [formData, validateField]
  );

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

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Error Message */}
      {submitError && (
        <LoginError
          message={submitError}
          onDismiss={() => setSubmitError(null)}
        />
      )}

      {/* Username Field */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <label
          htmlFor="username"
          className="block text-sm font-medium text-fnh-navy"
        >
          Username
        </label>
        <motion.input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => handleFieldChange("username", e.target.value)}
          onBlur={() => handleFieldBlur("username")}
          disabled={isLoading}
          placeholder="Enter your username"
          autoComplete="username"
          whileFocus={{ scale: 1.01 }}
          className={`w-full px-4 py-3 rounded-lg border-2 text-fnh-navy placeholder-fnh-grey transition-all duration-200 focus:outline-none ${
            touched.username && errors.username
              ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              : "border-fnh-grey-light bg-white focus:ring-2 focus:ring-fnh-blue-light/20 focus:border-fnh-blue"
          } ${
            isLoading ? "bg-fnh-porcelain text-fnh-grey cursor-not-allowed" : ""
          }`}
        />
        {touched.username && errors.username && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-red-600"
          >
            {errors.username}
          </motion.p>
        )}
      </motion.div>

      {/* Password Field */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <PasswordInput
          value={formData.password}
          onChange={(value) => handleFieldChange("password", value)}
          onBlur={() => handleFieldBlur("password")}
          error={touched.password ? errors.password : undefined}
          disabled={isLoading}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full h-12 px-4 bg-gradient-to-r from-fnh-navy to-fnh-navy-light text-fnh-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:to-fnh-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? <LoginLoading message="Logging in..." /> : "Login"}
      </motion.button>

      {/* Footer Info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-fnh-grey-dark"
      >
        For security purposes, sessions expire after 24 hours of inactivity.
      </motion.p>
    </motion.form>
  );
}
