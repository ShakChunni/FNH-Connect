"use client";

import React, { useState, useCallback } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useUpdatePassword } from "./hooks/useUpdatePassword";
import { useNotification } from "@/hooks/useNotification";
import { PASSWORD_POLICY, validatePassword } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";
import { PasswordGenerator } from "./PasswordGenerator";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  action?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  action,
  disabled = false,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs font-black uppercase tracking-wider text-fnh-navy-dark/80"
        >
          {label}
        </label>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-sm text-fnh-navy-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue disabled:opacity-60 disabled:cursor-not-allowed transition-[border-color,box-shadow]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-fnh-navy hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const { updatePassword, isLoading } = useUpdatePassword({
    onSuccess: (data) => {
      setServerError(null);
      setSuccessMessage(data.message);
      showNotification(data.message, "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      const message = error.message;
      setSuccessMessage(null);
      setServerError(message);
      showNotification(message, "error");
    },
  });

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      const policyCheck = validatePassword(newPassword);

      if (!policyCheck.valid) {
        newErrors.newPassword = policyCheck.errors.join(". ");
      }

      if (newPassword === currentPassword) {
        newErrors.newPassword =
          "New password must be different from your current password";
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setSuccessMessage(null);
      setErrors({});

      if (!validateForm()) {
        return;
      }

      updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
    },
    [currentPassword, newPassword, confirmPassword, updatePassword, validateForm],
  );

  const handleGeneratedPassword = useCallback((password: string) => {
    setNewPassword(password);
    setConfirmPassword(password);
    setServerError(null);
    setSuccessMessage(null);
    setErrors((currentErrors) => ({
      ...currentErrors,
      newPassword: undefined,
      confirmPassword: undefined,
      general: undefined,
    }));
  }, []);

  const handleGeneratorError = useCallback(
    (message: string) => {
      setSuccessMessage(null);
      setServerError(message);
      showNotification(message, "error");
    },
    [showNotification],
  );

  const getPasswordRequirementsText = () => {
    const requirements: string[] = [];
    requirements.push(
      `At least ${PASSWORD_POLICY.MIN_LENGTH} characters long`,
    );
    if (PASSWORD_POLICY.REQUIRE_UPPERCASE) {
      requirements.push("one uppercase letter");
    }
    if (PASSWORD_POLICY.REQUIRE_LOWERCASE) {
      requirements.push("one lowercase letter");
    }
    if (PASSWORD_POLICY.REQUIRE_NUMBER) {
      requirements.push("one number");
    }
    if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
      requirements.push("one special character");
    }

    if (requirements.length <= 2) {
      return requirements.join(" and ");
    }

    const last = requirements[requirements.length - 1];
    return `${requirements.slice(0, -1).join(", ")}, and ${last}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {(errors.general || serverError) && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-semibold">
            {errors.general || serverError}
          </p>
        </div>
      )}

      <PasswordField
        id="currentPassword"
        label="Current Password"
        value={currentPassword}
        onChange={setCurrentPassword}
        disabled={isLoading}
        placeholder="Enter your current password"
        autoComplete="current-password"
      />
      {errors.currentPassword && (
        <p className="text-xs font-semibold text-rose-600 -mt-2">
          {errors.currentPassword}
        </p>
      )}

      <PasswordField
        id="newPassword"
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        action={
          <PasswordGenerator
            disabled={isLoading}
            onGenerate={handleGeneratedPassword}
            onError={handleGeneratorError}
          />
        }
        disabled={isLoading}
        placeholder="Enter your new password"
        autoComplete="new-password"
      />
      {errors.newPassword && (
        <p className="text-xs font-semibold text-rose-600 -mt-2">
          {errors.newPassword}
        </p>
      )}

      <PasswordField
        id="confirmPassword"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={isLoading}
        placeholder="Re-enter your new password"
        autoComplete="new-password"
      />
      {errors.confirmPassword && (
        <p className="text-xs font-semibold text-rose-600 -mt-2">
          {errors.confirmPassword}
        </p>
      )}

      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
        <p className="text-xs font-semibold text-blue-800">
          Password requirements:
        </p>
        <p className="text-xs text-blue-700 mt-0.5">
          {getPasswordRequirementsText()}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black text-white transition-[background-color,box-shadow,transform]",
          isLoading
            ? "bg-fnh-navy/70 cursor-not-allowed"
            : "bg-fnh-navy hover:bg-fnh-navy-dark active:scale-[0.98] shadow-sm hover:shadow-md",
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          "Update Password"
        )}
      </button>
    </form>
  );
}
