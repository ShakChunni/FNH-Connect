"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/app/AuthContext";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { AuthUser } from "@/types/auth";

// Types for API requests/responses
interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface OTPRequest {
  username: string;
  otp: string;
}

interface SetPasswordRequest {
  username: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginData {
  username: string;
  email: string;
  requiresOTP: boolean;
  expiresIn: number;
}

// Login hook - Step 1 (send OTP)
export const usePasswordLogin = () => {
  return useMutation<ApiResponse<LoginData>, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const response = await fetchWithCSRF("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      return data;
    },
  });
};

// Login OTP verification hook - Step 2 (complete login)
export const useLoginOTPVerification = () => {
  const { login } = useAuth();

  return useMutation<ApiResponse<{ user: AuthUser }>, Error, OTPRequest>({
    mutationFn: async (otpData) => {
      const response = await fetchWithCSRF("/api/auth/login/verify-otp", {
        method: "POST",
        body: JSON.stringify(otpData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.data?.user) {
        // Call AuthContext login to set user and redirect
        login(data.data.user);
      }
    },
  });
};

// Register hook - Step 1 (send OTP)
export const useRegister = () => {
  return useMutation<ApiResponse<LoginData>, Error, RegisterRequest>({
    mutationFn: async (registrationData) => {
      const response = await fetchWithCSRF("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    },
  });
};

// Register OTP verification hook - Step 2
export const useRegisterOTPVerification = () => {
  return useMutation<ApiResponse, Error, OTPRequest>({
    mutationFn: async (otpData) => {
      const response = await fetchWithCSRF("/api/auth/register/verify-otp", {
        method: "POST",
        body: JSON.stringify(otpData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      return data;
    },
  });
};

// Set password hook - Step 3 (complete registration)
export const useSetPassword = () => {
  const { login } = useAuth();

  return useMutation<
    ApiResponse<{ user: AuthUser }>,
    Error,
    SetPasswordRequest
  >({
    mutationFn: async (passwordData) => {
      const response = await fetchWithCSRF("/api/auth/register/set-password", {
        method: "POST",
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password setup failed");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.data?.user) {
        // Call AuthContext login to set user and redirect
        login(data.data.user);
      }
    },
  });
};

// Forgot password hook - Step 1 (send reset link via email)
export const useForgotPassword = () => {
  return useMutation<ApiResponse, Error, { email: string }>({
    mutationFn: async (data) => {
      const response = await fetchWithCSRF("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to send reset link");
      }

      return responseData;
    },
  });
};

// Reset password hook - Step 2 (complete reset with token)
export const useResetPassword = () => {
  const { login } = useAuth();

  return useMutation<
    ApiResponse<{ user: AuthUser }>,
    Error,
    { token: string; password: string }
  >({
    mutationFn: async (resetData) => {
      const response = await fetchWithCSRF("/api/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify(resetData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.data?.user) {
        // Call AuthContext login to set user and redirect
        login(data.data.user);
      }
    },
  });
};
