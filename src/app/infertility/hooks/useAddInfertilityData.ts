import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  AddInfertilityPatientRequest,
  AddInfertilityPatientResponse,
} from "../types";
import { useNotification } from "@/hooks/useNotification";

export function useAddInfertilityData(
  options?: Partial<
    UseMutationOptions<
      AddInfertilityPatientResponse,
      Error,
      AddInfertilityPatientRequest
    >
  >
) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    ...options,
    mutationFn: async (
      data: AddInfertilityPatientRequest
    ): Promise<AddInfertilityPatientResponse> => {
      // Show loading notification
      showNotification("Adding infertility patient...", "loading");

      const response = await api.post<{
        success: boolean;
        data: AddInfertilityPatientResponse["data"];
        message: string;
        error?: string;
      }>("/infertility-patients", data);

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to add infertility patient"
        );
      }

      return response.data;
    },
    onSuccess: (response, variables, context) => {
      // Invalidate and refetch infertility patients queries
      queryClient.invalidateQueries({ queryKey: ["infertilityPatients"] });

      // Add the new patient to the cache if data exists
      if (response.data) {
        queryClient.setQueryData(
          ["infertilityPatients", {}],
          (oldData: any[] | undefined) => {
            if (!oldData) return [];
            // Note: Since the response doesn't include the full patient object, we just invalidate
            // In a real scenario, you might need to refetch or construct the object
            return oldData;
          }
        );
      }

      // Show success notification
      showNotification(
        response.message || "Infertility patient added successfully!",
        "success"
      );

      // Call the provided onSuccess if any
      (options?.onSuccess as any)?.(response, variables, undefined, context);
    },
    onError: (error: Error, variables, context) => {
      // Show error notification
      showNotification(
        error.message || "Failed to add infertility patient",
        "error"
      );

      // Call the provided onError if any
      (options?.onError as any)?.(error, variables, undefined, context);
    },
  });

  return {
    addPatient: mutation.mutate,
    isLoading: mutation.isPending,
    ...mutation,
  };
}
