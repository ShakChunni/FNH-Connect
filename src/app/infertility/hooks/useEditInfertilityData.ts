import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  EditInfertilityPatientRequest,
  EditInfertilityPatientResponse,
} from "../types";
import { useNotification } from "@/hooks/useNotification";

export function useEditInfertilityData(
  options?: Partial<
    UseMutationOptions<
      EditInfertilityPatientResponse,
      Error,
      EditInfertilityPatientRequest
    >
  >
) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    ...options,
    mutationFn: async (
      data: EditInfertilityPatientRequest
    ): Promise<EditInfertilityPatientResponse> => {
      // Show loading notification
      showNotification("Updating infertility patient...", "loading");

      const { id, ...updateData } = data;

      // Convert dates to strings for API
      const apiData = {
        ...updateData,
        patient: {
          ...updateData.patient,
          dateOfBirth: updateData.patient.dateOfBirth
            ? updateData.patient.dateOfBirth.toISOString().split("T")[0]
            : null,
        },
        spouseInfo: {
          ...updateData.spouseInfo,
          dateOfBirth: updateData.spouseInfo.dateOfBirth
            ? updateData.spouseInfo.dateOfBirth.toISOString().split("T")[0]
            : null,
        },
        medicalInfo: {
          ...updateData.medicalInfo,
          nextAppointment: updateData.medicalInfo.nextAppointment
            ? updateData.medicalInfo.nextAppointment.toISOString().split("T")[0]
            : null,
        },
      };

      const response = await api.patch<{
        success: boolean;
        data: EditInfertilityPatientResponse["data"];
        message?: string;
        error?: string;
      }>(`/infertility-patients/${id}`, apiData);

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to edit infertility patient"
        );
      }

      return response.data;
    },
    onSuccess: (response, variables, context) => {
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

      // Call the provided onSuccess if any
      (options?.onSuccess as any)?.(response, variables, undefined, context);
    },
    onError: (error: Error, variables, context) => {
      // Show error notification
      showNotification(
        error.message || "Failed to update infertility patient",
        "error"
      );

      // Call the provided onError if any
      (options?.onError as any)?.(error, variables, undefined, context);
    },
  });

  return {
    editPatient: mutation.mutate,
    isLoading: mutation.isPending,
    ...mutation,
  };
}
