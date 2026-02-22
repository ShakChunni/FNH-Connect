/**
 * Update Medicine Data Hook
 * React Query mutation for editing medicines
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { Medicine, UpdateMedicineInput } from "../types";

interface UpdateMedicineResponse {
  success: boolean;
  data: Medicine;
  message?: string;
  error?: string;
}

interface UpdateMedicinePayload {
  id: number;
  data: UpdateMedicineInput;
}

interface UseUpdateMedicineDataOptions {
  onSuccess?: (data: Medicine) => void;
  onError?: (error: Error) => void;
}

export function useUpdateMedicineData(options?: UseUpdateMedicineDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateMedicinePayload,
    ): Promise<UpdateMedicineResponse> => {
      const response = await api.patch<UpdateMedicineResponse>(
        `/medicine-inventory/medicines/${payload.id}`,
        payload.data,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });

      showNotification(
        response.message || "Medicine updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update medicine. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    updateMedicine: mutation.mutate,
    updateMedicineAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
