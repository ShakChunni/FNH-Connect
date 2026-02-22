"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/app/AuthContext";
import { LoginForm } from "./components";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { LoginFormData, LoginResponse } from "./types";
import { FaWhatsapp } from "react-icons/fa";

const ADMIN_WHATSAPP = "+61421705876";

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
    <div className="space-y-8 px-2 sm:px-0">
      {/* Header - Mobile Logo Only */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3">
        {/* Visible only on mobile/tablet where right panel is hidden */}
        <div className="relative w-14 h-14 mb-6 lg:hidden">
          <Image
            src="/fnh-logo.svg"
            alt="FNH Logo"
            fill
            className="object-contain"
          />
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-fnh-navy font-sans">
          Welcome back
        </h2>
        <p className="text-fnh-grey-dark max-w-sm text-base leading-relaxed text-opacity-90">
          Please enter your credentials to access the FNH Connect portal.
        </p>
      </div>

      <div className="w-full">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
      </div>

      <div className="pt-6 border-t border-gray-100">
        <p className="text-center sm:text-left text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
          Support
        </p>
        <button
          onClick={openWhatsApp}
          className="flex items-center justify-center sm:justify-start gap-2.5 text-sm font-semibold text-fnh-navy hover:text-fnh-blue transition-all duration-300 cursor-pointer mx-auto sm:mx-0 group w-full sm:w-auto p-2 sm:p-0 rounded-lg hover:bg-gray-50 sm:hover:bg-transparent"
        >
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <FaWhatsapp className="w-4 h-4 text-[#25D366]" />
          </div>
          <span className="group-hover:translate-x-0.5 transition-transform">
            Contact Administrator (F.M. Ashfaq)
          </span>
        </button>
      </div>
    </div>
  );
}
