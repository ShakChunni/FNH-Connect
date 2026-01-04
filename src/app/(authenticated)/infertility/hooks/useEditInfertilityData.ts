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
import axios from "axios";

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
      let errorMessage = "Failed to update infertility patient";

      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as any;

        // Prefer explicit error message from server
        if (data.error) errorMessage = data.error;
        if (data.message) errorMessage = data.message;

        // Append detailed validation errors if available
        if (data.details && typeof data.details === "object") {
          const detailsStr = Object.entries(data.details)
            .map(([field, msgs]) => {
              if (Array.isArray(msgs)) return `${field}: ${msgs.join(", ")}`;
              return `${field}: ${msgs}`;
            })
            .join("; ");

          if (detailsStr) {
            errorMessage += ` (${detailsStr})`;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Show error notification
      showNotification(errorMessage, "error");

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
