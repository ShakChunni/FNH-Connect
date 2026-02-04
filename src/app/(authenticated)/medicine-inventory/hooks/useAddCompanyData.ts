/**
 * Add Company Data Hook
 * React Query mutation for creating new pharmaceutical companies/suppliers
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { MedicineCompany, CreateCompanyInput } from "../types";

interface AddCompanyResponse {
  success: boolean;
  data: MedicineCompany;
  message?: string;
  error?: string;
}

interface UseAddCompanyDataOptions {
  onSuccess?: (data: MedicineCompany) => void;
  onError?: (error: Error) => void;
  showSuccessNotification?: boolean;
}

export function useAddCompanyData(options?: UseAddCompanyDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateCompanyInput,
    ): Promise<AddCompanyResponse> => {
      const response = await api.post<AddCompanyResponse>(
        "/medicine-inventory/companies",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["medicine-inventory", "companies"],
      });

      // Show success notification (can be disabled for inline adds)
      if (options?.showSuccessNotification !== false) {
        showNotification(
          response.message || "Company added successfully!",
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
        error.message || "Failed to add company. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addCompany: mutation.mutate,
    addCompanyAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
