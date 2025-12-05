"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/app/AuthContext";
import { LoginForm } from "./components";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { LoginFormData, LoginResponse } from "./types";
import { FaWhatsapp } from "react-icons/fa";

const ADMIN_WHATSAPP = "+8801736436786";

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (formData: LoginFormData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchWithCSRF("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              errorData.message ||
              "Login failed. Please try again."
          );
        }

        const data: LoginResponse = await response.json();

        if (!data.success || !data.user) {
          throw new Error(data.error || "Login failed. Please try again.");
        }

        // Call AuthContext login to set user and redirect
        await login(data.user);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        console.error("Login error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  const openWhatsApp = () => {
    const number = ADMIN_WHATSAPP.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${number}`, "_blank");
  };

  return (
    <div className="space-y-8 px-4 sm:px-0">
      {/* Header - Mobile Logo Only */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
        {/* Visible only on mobile/tablet where right panel is hidden */}
        <div className="relative w-16 h-16 mb-4 lg:hidden">
          <Image
            src="/fnh-logo.svg"
            alt="FNH Logo"
            fill
            className="object-contain"
          />
        </div>

        {/* Adjusted text sizing for responsiveness */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fnh-navy">
          Welcome back
        </h2>
        <p className="text-fnh-grey-dark max-w-sm text-sm sm:text-base">
          Please enter your credentials to access the FNH Connect portal.
        </p>
      </div>

      <div className="w-full">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
      </div>

      <div className="pt-4 border-t border-fnh-grey-lighter">
        <p className="text-center sm:text-left text-xs sm:text-sm text-fnh-grey mb-2">
          Don't have an account or need support?
        </p>
        <button
          onClick={openWhatsApp}
          // Simplified button text for mobile
          className="flex items-center gap-2 text-sm font-semibold text-fnh-blue hover:text-fnh-blue-dark transition-colors cursor-pointer mx-auto sm:mx-0 group"
        >
          <FaWhatsapp className="w-4 h-4 group-hover:text-[#25D366] transition-colors" />
          <span className="sm:hidden">Administrator</span>
          <span className="hidden sm:inline">
            Contact Administrator (F.M. Ashfaq)
          </span>
        </button>
      </div>
    </div>
  );
}
