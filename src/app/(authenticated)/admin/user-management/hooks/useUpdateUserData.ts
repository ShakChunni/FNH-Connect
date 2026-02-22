/**
 * Update User Data Hook
 * React Query mutation for editing users
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { UserWithStaff, UpdateUserInput } from "../types";

interface UpdateUserResponse {
  success: boolean;
  data: UserWithStaff;
  message?: string;
  error?: string;
}

interface UpdateUserPayload {
  id: number;
  data: UpdateUserInput;
}

interface UseUpdateUserDataOptions {
  onSuccess?: (data: UserWithStaff) => void;
  onError?: (error: Error) => void;
}

export function useUpdateUserData(options?: UseUpdateUserDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateUserPayload,
    ): Promise<UpdateUserResponse> => {
      const response = await api.patch<UpdateUserResponse>(
        `/admin/user-management/${payload.id}`,
        payload.data,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "User updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update user. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    updateUser: mutation.mutate,
    updateUserAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
