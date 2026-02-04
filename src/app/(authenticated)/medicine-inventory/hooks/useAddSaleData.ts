/**
 * Add Sale Data Hook
 * React Query mutation for creating medicine sales
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { MedicineSale, CreateSaleInput } from "../types";

interface AddSaleResponse {
  success: boolean;
  data: MedicineSale;
  message?: string;
  error?: string;
}

interface UseAddSaleDataOptions {
  onSuccess?: (data: MedicineSale) => void;
  onError?: (error: Error) => void;
}

export function useAddSaleData(options?: UseAddSaleDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (payload: CreateSaleInput): Promise<AddSaleResponse> => {
      const response = await api.post<AddSaleResponse>(
        "/medicine-inventory/sales",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });

      // Show success notification
      showNotification(
        response.message || "Sale recorded successfully!",
        "success",
      );

      // Call custom onSuccess
      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to record sale. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addSale: mutation.mutate,
    addSaleAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
