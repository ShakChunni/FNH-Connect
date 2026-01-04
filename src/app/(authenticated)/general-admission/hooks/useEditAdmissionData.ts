/**
 * Edit Admission Data Hook
 * React Query mutation for updating admissions
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import { UpdateAdmissionPayload } from "../types";
import { useAdmissionFormStore } from "../stores/formStore";

interface EditAdmissionResponse {
  success: boolean;
  data: {
    id: number;
    admissionNumber: string;
    patientFullName: string;
    status: string;
    grandTotal: number;
    dueAmount: number;
    updatedAt: string;
  };
  message?: string;
  error?: string;
}

interface UseEditAdmissionDataOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEditAdmissionData(options?: UseEditAdmissionDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const resetForm = useAdmissionFormStore((state) => state.resetForm);

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateAdmissionPayload
    ): Promise<EditAdmissionResponse> => {
      const { id, ...data } = payload;
      const response = await api.patch<EditAdmissionResponse>(
        `/admissions/${id}`,
        data
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
        response.message || "Admission updated successfully!",
        "success"
      );

      // Call custom onSuccess
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update admission. Please try again.",
        "error"
      );
      options?.onError?.(error);
    },
  });

  return {
    editAdmission: mutation.mutate,
    editAdmissionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
