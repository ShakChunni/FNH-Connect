import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import axios from "axios";

interface UpdateInfertilityStatusRequest {
  id: number;
  status: string;
}

interface UpdateInfertilityStatusResponse {
  success: boolean;
  data: {
    id: number;
    caseNumber: string;
    status: string | null;
  };
  message: string;
}

export function useUpdateInfertilityPatientStatus() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateInfertilityStatusRequest
    ): Promise<UpdateInfertilityStatusResponse> => {
      const response = await api.patch<UpdateInfertilityStatusResponse>(
        `/infertility-patients/${payload.id}/status`,
        { status: payload.status }
      );

      if (!response.data.success) {
        throw new Error("Failed to update patient status");
      }

      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["infertilityPatients"] });
      showNotification(response.message || "Status updated successfully", "success");
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to update patient status";

      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as { error?: string; message?: string };
        if (data.error) errorMessage = data.error;
        if (data.message) errorMessage = data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(errorMessage, "error");
    },
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    ...mutation,
  };
}

