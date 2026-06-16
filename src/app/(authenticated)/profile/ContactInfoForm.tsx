"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  X,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";
import { useUpdateProfileContact } from "./hooks/useUpdateProfileContact";

interface ContactInfoFormProps {
  initialEmail?: string;
  initialPhoneNumber?: string;
}

interface ContactFormErrors {
  email?: string;
  phoneNumber?: string;
  general?: string;
}

function isValidEmail(value: string) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactInfoForm({
  initialEmail = "",
  initialPhoneNumber = "",
}: ContactInfoFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [savedEmail, setSavedEmail] = useState(initialEmail);
  const [savedPhoneNumber, setSavedPhoneNumber] = useState(initialPhoneNumber);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { showNotification } = useNotification();

  const { updateProfileContact, isLoading } = useUpdateProfileContact({
    onSuccess: (data) => {
      const nextEmail = data.data.email || "";
      const nextPhoneNumber = data.data.phoneNumber || "";
      setEmail(nextEmail);
      setPhoneNumber(nextPhoneNumber);
      setSavedEmail(nextEmail);
      setSavedPhoneNumber(nextPhoneNumber);
      setIsEditing(false);
      setErrors({});
      setSuccessMessage(data.message);
      showNotification(data.message, "success");
      router.refresh();
    },
    onError: (error) => {
      setSuccessMessage(null);
      setErrors({ general: error.message });
      showNotification(error.message, "error");
    },
  });

  const validateForm = useCallback(() => {
    const nextErrors: ContactFormErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (trimmedEmail.length > 200) {
      nextErrors.email = "Email must be 200 characters or less";
    }

    if (trimmedPhoneNumber.length > 50) {
      nextErrors.phoneNumber = "Phone number must be 50 characters or less";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [email, phoneNumber]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSuccessMessage(null);

      if (!validateForm()) {
        return;
      }

      updateProfileContact({
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });
    },
    [email, phoneNumber, updateProfileContact, validateForm],
  );

  const handleStartEditing = useCallback(() => {
    setSuccessMessage(null);
    setErrors({});
    setIsEditing(true);
  }, []);

  const handleCancelEditing = useCallback(() => {
    setEmail(savedEmail);
    setPhoneNumber(savedPhoneNumber);
    setSuccessMessage(null);
    setErrors({});
    setIsEditing(false);
  }, [savedEmail, savedPhoneNumber]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-fnh-navy-dark">
            Contact Information
          </h4>
          <p className="text-xs text-gray-500">
            Email and phone are the only editable profile fields.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEditing}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-fnh-blue/20 bg-blue-50 px-3 text-xs font-bold text-fnh-blue transition-colors hover:bg-blue-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : null}
      </div>

      {successMessage ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold sm:text-sm">{successMessage}</p>
        </div>
      ) : null}

      {errors.general ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 sm:text-sm">
          {errors.general}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="profileEmail"
          className="block text-xs font-black uppercase tracking-wider text-fnh-navy-dark/80"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="profileEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!isEditing || isLoading}
            placeholder="Enter email address"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm text-fnh-navy-dark transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-fnh-blue focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
          />
        </div>
        {errors.email ? (
          <p className="text-xs font-semibold text-rose-600">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="profilePhoneNumber"
          className="block text-xs font-black uppercase tracking-wider text-fnh-navy-dark/80"
        >
          Phone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="profilePhoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={!isEditing || isLoading}
            placeholder="Enter phone number"
            autoComplete="tel"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm text-fnh-navy-dark transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-fnh-blue focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
          />
        </div>
        {errors.phoneNumber ? (
          <p className="text-xs font-semibold text-rose-600">
            {errors.phoneNumber}
          </p>
        ) : null}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleCancelEditing}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition-[background-color,box-shadow,transform]",
              isLoading
                ? "cursor-not-allowed bg-fnh-navy/70"
                : "bg-fnh-navy shadow-sm hover:bg-fnh-navy-dark hover:shadow-md active:scale-[0.98]",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>
      ) : null}
    </form>
  );
}
