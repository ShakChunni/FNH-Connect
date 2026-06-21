/**
 * Batch Sale Data Hook
 * React Query mutation for creating a multi-item Medicine Inventory
 * direct pharmacy sale.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type {
  CreateSaleBatchInput,
  CreateSaleBatchResult,
} from "../types";

interface AddBatchSaleResponse {
  success: boolean;
  data: CreateSaleBatchResult;
  message?: string;
  error?: string;
  details?: unknown;
}

interface UseAddBatchSaleDataOptions {
  onSuccess?: (data: CreateSaleBatchResult) => void;
  onError?: (error: Error) => void;
}

export function useAddBatchSaleData(options?: UseAddBatchSaleDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateSaleBatchInput,
    ): Promise<AddBatchSaleResponse> => {
      const response = await api.post<AddBatchSaleResponse>(
        "/medicine-inventory/sales/batch",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });
      showNotification(
        response.message || "Sale recorded successfully!",
        "success",
      );
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
    addBatchSale: mutation.mutate,
    addBatchSaleAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
