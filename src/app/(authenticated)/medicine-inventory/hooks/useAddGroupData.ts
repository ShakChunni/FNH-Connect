/**
 * Add Group Data Hook
 * React Query mutation for creating new medicine groups/categories
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { MedicineGroup, CreateGroupInput } from "../types";

interface AddGroupResponse {
  success: boolean;
  data: MedicineGroup;
  message?: string;
  error?: string;
}

interface UseAddGroupDataOptions {
  onSuccess?: (data: MedicineGroup) => void;
  onError?: (error: Error) => void;
  showSuccessNotification?: boolean;
}

export function useAddGroupData(options?: UseAddGroupDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateGroupInput,
    ): Promise<AddGroupResponse> => {
      const response = await api.post<AddGroupResponse>(
        "/medicine-inventory/groups",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "groups"],
      });

      // Show success notification (can be disabled for inline adds)
      if (options?.showSuccessNotification !== false) {
        showNotification(
          response.message || "Group added successfully!",
          "success",
        );
      }

      // Call custom onSuccess
      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to add group. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addGroup: mutation.mutate,
    addGroupAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
