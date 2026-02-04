/**
 * Add Purchase Data Hook
 * React Query mutation for creating medicine purchases
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { MedicinePurchase, CreatePurchaseInput } from "../types";

interface AddPurchaseResponse {
  success: boolean;
  data: MedicinePurchase;
  message?: string;
  error?: string;
}

interface UseAddPurchaseDataOptions {
  onSuccess?: (data: MedicinePurchase) => void;
  onError?: (error: Error) => void;
}

export function useAddPurchaseData(options?: UseAddPurchaseDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: CreatePurchaseInput,
    ): Promise<AddPurchaseResponse> => {
      const response = await api.post<AddPurchaseResponse>(
        "/medicine-inventory/purchases",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });

      // Show success notification
      showNotification(
        response.message || "Purchase recorded successfully!",
        "success",
      );

      // Call custom onSuccess
      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to record purchase. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addPurchase: mutation.mutate,
    addPurchaseAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
