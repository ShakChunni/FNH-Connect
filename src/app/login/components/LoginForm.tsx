"use client";

import React, { useState, useCallback } from "react";
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
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Error Message */}
      {submitError && (
        <LoginError
          message={submitError}
          onDismiss={() => setSubmitError(null)}
        />
      )}

      {/* Username Field */}
      <div className="space-y-2 animate-slide-in-from-bottom [animation-delay:100ms]">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-fnh-navy"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => handleFieldChange("username", e.target.value)}
          onBlur={() => handleFieldBlur("username")}
          disabled={isLoading}
          placeholder="Enter your username"
          autoComplete="username"
          // Removed scale effect, added clean color transition, reduced text size for small screens
          className={`w-full px-4 py-3 rounded-lg border-2 text-sm sm:text-base text-fnh-navy placeholder-fnh-grey transition-colors duration-200 focus:outline-none ${
            touched.username && errors.username
              ? "border-red-500 bg-red-50 focus:border-red-600"
              : "border-fnh-grey-light bg-white focus:border-fnh-blue hover:border-fnh-blue-light"
          } ${
            isLoading ? "bg-fnh-porcelain text-fnh-grey cursor-not-allowed" : ""
          }`}
        />
        {/* Smooth Error Reveal */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            touched.username && errors.username
              ? "grid-rows-[1fr] opacity-100 mt-1"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-red-600">
              {errors.username}
            </p>
          </div>
        </div>
      </div>

      {/* Password Field */}
      <div className="animate-slide-in-from-bottom [animation-delay:200ms]">
        <PasswordInput
          value={formData.password}
          onChange={(value) => handleFieldChange("password", value)}
          onBlur={() => handleFieldBlur("password")}
          error={touched.password ? errors.password : undefined}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <div className="animate-slide-in-from-bottom [animation-delay:300ms]">
        <button
          type="submit"
          disabled={isLoading}
          // Removed scale, using pure color transitions
          className="w-full h-12 px-4 bg-fnh-navy text-fnh-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-fnh-navy-light focus:ring-2 focus:ring-offset-2 focus:ring-fnh-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
        >
          {isLoading ? <LoginLoading message="Logging in..." /> : "Login"}
        </button>
      </div>

      {/* Footer Info */}
      <p className="text-center text-xs text-fnh-grey-dark animate-slide-in-from-bottom [animation-delay:400ms]">
        For security purposes, sessions expire after 24 hours of inactivity.
      </p>
    </form>
  );
}
