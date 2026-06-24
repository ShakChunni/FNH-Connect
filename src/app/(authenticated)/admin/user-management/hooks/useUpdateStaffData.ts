/**
 * Update Staff Data Hook
 * React Query mutation for editing standalone staff records
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { StaffRecord, UpdateStaffInput } from "../types";

interface UpdateStaffResponse {
  success: boolean;
  data: StaffRecord;
  message?: string;
  error?: string;
}

interface UpdateStaffPayload {
  id: number;
  data: UpdateStaffInput;
}

interface UseUpdateStaffDataOptions {
  onSuccess?: (data: StaffRecord) => void;
  onError?: (error: Error) => void;
}

export function useUpdateStaffData(options?: UseUpdateStaffDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateStaffPayload,
    ): Promise<UpdateStaffResponse> => {
      const response = await api.patch<UpdateStaffResponse>(
        `/admin/user-management/staff/${payload.id}`,
        payload.data,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "Staff member updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update staff member. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    updateStaff: mutation.mutate,
    updateStaffAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
