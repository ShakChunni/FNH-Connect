import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { InfertilityTestData } from "../types";
import { useNotification } from "@/hooks/useNotification";
import axios from "axios";

interface EditInfertilityTestResponse {
  success: boolean;
  data: InfertilityTestData;
  message: string;
  error?: string;
}

export function useEditInfertilityTest(
  options?: Partial<
    UseMutationOptions<
      EditInfertilityTestResponse,
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
    ): Promise<EditInfertilityTestResponse> => {
      // Show loading notification
      showNotification("Updating investigation...", "loading");

      const { id, ...updateData } = data;
      const response = await api.patch<EditInfertilityTestResponse>(
        `/infertility-patients/tests/${id}`,
        updateData
      );

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
    },
    onError: (error: Error, variables, context) => {
      let errorMessage = "Failed to update investigation";

      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as {
          error?: string;
          message?: string;
          details?: Record<string, string[] | string>;
        };

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
    },
  });

  return {
    editPatient: mutation.mutate,
    isLoading: mutation.isPending,
    ...mutation,
  };
}
