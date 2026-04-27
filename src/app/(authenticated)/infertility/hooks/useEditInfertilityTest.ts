import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { InfertilityTestData } from "../types";
import { useNotification } from "@/hooks/useNotification";
import axios from "axios";

export function useEditInfertilityTest(
  options?: Partial<
    UseMutationOptions<
      any,
      Error,
      InfertilityTestData
    >
  >
) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    ...options,
    mutationFn: async (
      data: InfertilityTestData
    ): Promise<any> => {
      // Show loading notification
      showNotification("Updating investigation...", "loading");

      const { id, ...updateData } = data;
      const response = await api.patch<{
        success: boolean;
        data: any["data"];
        message: string;
        error?: string;
      }>(`/infertility-patients/tests/${id}`, updateData);

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to update investigation"
        );
      }

      return response.data;
    },
    onSuccess: (response, variables, context) => {
      // Invalidate and refetch infertilityTest patients queries
      queryClient.invalidateQueries({ queryKey: ["infertilityTestPatients"] });

      // Show success notification
      showNotification(
        response.message || "Investigation updated successfully!",
        "success"
      );

      // Call the provided onSuccess if any
      (options?.onSuccess as any)?.(response, variables, undefined, context);
    },
    onError: (error: Error, variables, context) => {
      let errorMessage = "Failed to update investigation";

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
