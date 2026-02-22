/**
 * Update Company Data Hook
 * React Query mutation for editing medicine companies
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { MedicineCompany, CreateCompanyInput } from "../types";

interface UpdateCompanyResponse {
  success: boolean;
  data: MedicineCompany;
  message?: string;
  error?: string;
}

interface UpdateCompanyPayload {
  id: number;
  data: CreateCompanyInput;
}

interface UseUpdateCompanyDataOptions {
  onSuccess?: (data: MedicineCompany) => void;
  onError?: (error: Error) => void;
}

export function useUpdateCompanyData(options?: UseUpdateCompanyDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateCompanyPayload,
    ): Promise<UpdateCompanyResponse> => {
      const response = await api.patch<UpdateCompanyResponse>(
        `/medicine-inventory/companies/${payload.id}`,
        payload.data,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });

      showNotification(
        response.message || "Company updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update company. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    updateCompany: mutation.mutate,
    updateCompanyAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
