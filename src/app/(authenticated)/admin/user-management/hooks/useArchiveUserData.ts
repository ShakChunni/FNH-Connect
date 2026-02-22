/**
 * Archive User Data Hook
 * React Query mutation for archiving/unarchiving users
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { UserWithStaff } from "../types";

interface ArchiveUserResponse {
  success: boolean;
  data: UserWithStaff;
  message?: string;
  error?: string;
}

interface ArchiveUserPayload {
  id: number;
  isActive: boolean;
}

interface UseArchiveUserDataOptions {
  onSuccess?: (data: UserWithStaff) => void;
  onError?: (error: Error) => void;
}

export function useArchiveUserData(options?: UseArchiveUserDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: ArchiveUserPayload,
    ): Promise<ArchiveUserResponse> => {
      const response = await api.patch<ArchiveUserResponse>(
        `/admin/user-management/${payload.id}/archive`,
        { isActive: payload.isActive },
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "User status updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update user status. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    archiveUser: mutation.mutate,
    archiveUserAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
