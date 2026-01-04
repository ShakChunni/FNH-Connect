/**
 * Add Admission Data Hook
 * React Query mutation for creating new admissions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import { CreateAdmissionPayload, AdmissionPatientData } from "../types";
import { useAdmissionFormStore } from "../stores/formStore";

interface AddAdmissionResponse {
  success: boolean;
  data: AdmissionPatientData;
  message?: string;
  error?: string;
}

interface UseAddAdmissionDataOptions {
  onSuccess?: (data: AdmissionPatientData) => void;
  onError?: (error: Error) => void;
}

export function useAddAdmissionData(options?: UseAddAdmissionDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const resetForm = useAdmissionFormStore((state) => state.resetForm);

  const mutation = useMutation({
    mutationFn: async (
      payload: CreateAdmissionPayload
    ): Promise<AddAdmissionResponse> => {
      const response = await api.post<AddAdmissionResponse>(
        "/admissions",
        payload
      );
      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate admissions queries
      queryClient.invalidateQueries({ queryKey: ["admissions"] });

      // Reset form
      resetForm();

      // Show success notification
      showNotification(
        response.message || "Patient admitted successfully!",
        "success"
      );

      // Call custom onSuccess
      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to admit patient. Please try again.",
        "error"
      );
      options?.onError?.(error);
    },
  });

  return {
    addAdmission: mutation.mutate,
    addAdmissionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
