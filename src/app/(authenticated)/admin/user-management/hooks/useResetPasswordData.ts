/**
 * Reset Password Data Hook
 * React Query mutation for resetting user passwords
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface ResetPasswordPayload {
  id: number;
  newPassword: string;
}

interface UseResetPasswordDataOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useResetPasswordData(options?: UseResetPasswordDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: ResetPasswordPayload,
    ): Promise<ResetPasswordResponse> => {
      const response = await api.patch<ResetPasswordResponse>(
        `/admin/user-management/${payload.id}/reset-password`,
        { newPassword: payload.newPassword },
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "Password reset successfully!",
        "success",
      );

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to reset password. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    resetPassword: mutation.mutate,
    resetPasswordAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
