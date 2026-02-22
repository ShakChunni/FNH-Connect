/**
 * Add Staff Data Hook
 * React Query mutation for creating standalone staff records
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { StaffRecord, CreateStaffInput } from "../types";

interface AddStaffResponse {
  success: boolean;
  data: StaffRecord;
  message?: string;
  error?: string;
}

interface UseAddStaffDataOptions {
  onSuccess?: (data: StaffRecord) => void;
  onError?: (error: Error) => void;
}

export function useAddStaffData(options?: UseAddStaffDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateStaffInput,
    ): Promise<AddStaffResponse> => {
      const response = await api.post<AddStaffResponse>(
        "/admin/user-management/staff",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "Staff member created successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to create staff member. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addStaff: mutation.mutate,
    addStaffAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
