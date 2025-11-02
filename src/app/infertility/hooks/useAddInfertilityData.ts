import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  AddInfertilityPatientRequest,
  AddInfertilityPatientResponse,
} from "@/types/infertility";

export function useAddInfertilityData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: AddInfertilityPatientRequest
    ): Promise<AddInfertilityPatientResponse> => {
      try {
        const response = await api.post<AddInfertilityPatientResponse>(
          "/infertility-patients",
          data
        );

        console.log("Add Infertility Patient API Response:", response.data);

        if (!response.data.success) {
          throw new Error(
            response.data.error || "Failed to add infertility patient"
          );
        }

        return response.data;
      } catch (error) {
        console.error("Error adding infertility patient:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch infertility patients list
      queryClient.invalidateQueries({
        queryKey: ["infertilityPatients"],
      });
    },
  });
}
