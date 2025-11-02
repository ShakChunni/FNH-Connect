"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { LoginForm } from "./components";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { LoginFormData, LoginResponse } from "./types";

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fnh-porcelain via-fnh-grey-light to-white p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-fnh-navy mb-2">FNH Connect</h1>
          <p className="text-fnh-grey-dark text-sm">
            Healthcare Management System
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-fnh-white p-8 rounded-2xl shadow-lg border border-fnh-grey-light"
        >
          <motion.h2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-2 text-fnh-navy"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-fnh-grey-dark text-sm mb-6"
          >
            Please enter your credentials to access your account
          </motion.p>

          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-fnh-grey mt-6"
        >
          © 2025 FNH Connect. All rights reserved.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
