/**
 * Delete Staff Data Hook
 * React Query mutation for deleting standalone staff records
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { ApiResponse } from "../types";
import { isAxiosError } from "axios";

interface UseDeleteStaffDataOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteStaffData(options?: UseDeleteStaffDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (staffId: number): Promise<ApiResponse<void>> => {
      const response = await api.delete<ApiResponse<void>>(
        `/admin/user-management/staff/${staffId}`,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "Staff member deleted successfully!",
        "success",
      );

      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to delete staff member. Please try again.";

      if (isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, "error");
      options?.onError?.(error);
    },
  });

  return {
    deleteStaff: mutation.mutate,
    deleteStaffAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
