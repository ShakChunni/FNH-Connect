"use client";

import { useMutation } from "@tanstack/react-query";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import { useAuth as useAuthContext } from "@/app/AuthContext";
import type { LoginFormData, LoginResponse, ApiResponse } from "@/types/auth";

export const useLogin = () => {
  const { login } = useAuthContext();

  return useMutation<LoginResponse, Error, LoginFormData>({
    mutationFn: async (credentials) => {
      const response = await fetchWithCSRF("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        login(data.user);
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthContext();

  return useMutation<ApiResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetchWithCSRF("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logout failed");
      }

      return data;
    },
    onSuccess: () => {
      logout();
    },
  });
};
