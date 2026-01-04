import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import axios from "axios";

interface UpdateStatusRequest {
  id: number;
  isCompleted: boolean;
}

interface UpdateStatusResponse {
  success: boolean;
  data: {
    id: number;
    isCompleted: boolean;
  };
  message: string;
}

/**
 * Hook for updating pathology test status (completed/pending)
 * Uses react-query mutation with automatic cache invalidation
 */
export function useUpdatePathologyStatus() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      data: UpdateStatusRequest
    ): Promise<UpdateStatusResponse> => {
      const response = await api.patch<UpdateStatusResponse>(
        `/pathology-patients/${data.id}/status`,
        { isCompleted: data.isCompleted }
      );

      if (!response.data.success) {
        throw new Error("Failed to update status");
      }

      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate and refetch pathology patients queries
      queryClient.invalidateQueries({ queryKey: ["pathologyPatients"] });

      // Show success notification
      showNotification(
        response.message || "Status updated successfully!",
        "success"
      );
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to update status";

      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as any;
        if (data.error) errorMessage = data.error;
        if (data.message) errorMessage = data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, "error");
    },
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    ...mutation,
  };
}
