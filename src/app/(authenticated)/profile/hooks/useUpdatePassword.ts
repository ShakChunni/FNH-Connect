/**
 * Update Password Hook
 * React Query mutation for changing the authenticated user's password
 */

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/axios";

interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdatePasswordSuccessResponse {
  success: true;
  message: string;
}

interface UpdatePasswordErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

interface UseUpdatePasswordOptions {
  onSuccess?: (data: UpdatePasswordSuccessResponse) => void;
  onError?: (error: Error) => void;
}

function getErrorMessage(error: Error): string {
  if (axios.isAxiosError<UpdatePasswordErrorResponse>(error)) {
    const details = error.response?.data?.details;
    const fieldErrors = details
      ? Object.values(details).flat().filter(Boolean)
      : [];

    return (
      fieldErrors[0] ||
      error.response?.data?.error ||
      "Failed to update password. Please try again."
    );
  }

  return error.message || "Failed to update password. Please try again.";
}

export function useUpdatePassword(options?: UseUpdatePasswordOptions) {
  const mutation = useMutation<
    UpdatePasswordSuccessResponse,
    Error,
    UpdatePasswordPayload
  >({
    mutationFn: async (payload) => {
      const response = await api.patch<UpdatePasswordSuccessResponse>(
        "/profile/password",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(new Error(getErrorMessage(error)));
    },
  });

  return {
    updatePassword: mutation.mutate,
    updatePasswordAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    data: mutation.data,
  };
}
