/**
 * Archive Staff Data Hook
 * React Query mutation for archiving/unarchiving standalone staff records
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { StaffRecord } from "../types";
import { isAxiosError } from "axios";

interface ArchiveStaffResponse {
  success: boolean;
  data: StaffRecord;
  message?: string;
  error?: string;
}

interface ArchiveStaffPayload {
  id: number;
  isActive: boolean;
}

interface UseArchiveStaffDataOptions {
  onSuccess?: (data: StaffRecord) => void;
  onError?: (error: Error) => void;
}

export function useArchiveStaffData(options?: UseArchiveStaffDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: ArchiveStaffPayload,
    ): Promise<ArchiveStaffResponse> => {
      const response = await api.patch<ArchiveStaffResponse>(
        `/admin/user-management/staff/${payload.id}/archive`,
        { isActive: payload.isActive },
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "Staff member status updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to update staff status. Please try again.";

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
    archiveStaff: mutation.mutate,
    archiveStaffAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
