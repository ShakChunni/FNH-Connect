/**
 * Add Medicine Data Hook
 * React Query mutation for creating new medicines
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { Medicine, CreateMedicineInput } from "../types";

interface AddMedicineResponse {
  success: boolean;
  data: Medicine;
  message?: string;
  error?: string;
}

interface UseAddMedicineDataOptions {
  onSuccess?: (data: Medicine) => void;
  onError?: (error: Error) => void;
}

export function useAddMedicineData(options?: UseAddMedicineDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateMedicineInput,
    ): Promise<AddMedicineResponse> => {
      const response = await api.post<AddMedicineResponse>(
        "/medicine-inventory/medicines",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "medicines"],
      });
      queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "stats"],
      });

      // Show success notification
      showNotification(
        response.message || "Medicine added successfully!",
        "success",
      );

      // Call custom onSuccess
      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to add medicine. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addMedicine: mutation.mutate,
    addMedicineAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
