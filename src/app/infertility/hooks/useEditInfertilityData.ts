import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  EditInfertilityPatientRequest,
  EditInfertilityPatientResponse,
} from "../types";
import { useNotification } from "@/hooks/useNotification";

export function useEditInfertilityData() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: async (
      data: EditInfertilityPatientRequest
    ): Promise<EditInfertilityPatientResponse> => {
      // Show loading notification
      showNotification("Updating infertility patient...", "loading");

      const { id, ...updateData } = data;
      const response = await api.patch<{
        success: boolean;
        data: EditInfertilityPatientResponse["data"];
        message?: string;
        error?: string;
      }>(`/infertility-patients/${id}`, updateData);

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to edit infertility patient"
        );
      }

      return response.data;
    },
    onSuccess: (response) => {
      // Invalidate and refetch infertility patients queries
      queryClient.invalidateQueries({ queryKey: ["infertilityPatients"] });

      // Update the patient in the cache if data exists
      if (response.data) {
        queryClient.setQueryData(
          ["infertilityPatients", {}],
          (oldData: any[] | undefined) => {
            if (!oldData) return [];
            // Note: Since we don't have the full updated object, we invalidate
            return oldData;
          }
        );
      }

      // Show success notification
      showNotification(
        response.message || "Infertility patient updated successfully!",
        "success"
      );
    },
    onError: (error: any) => {
      // Show error notification
      showNotification(
        error.message || "Failed to update infertility patient",
        "error"
      );
    },
  });
}
