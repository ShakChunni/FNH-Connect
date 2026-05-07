import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";

interface CreatedInfertilityTestPayload {
  infertilityTest: {
    id: number;
    testNumber: string;
  };
  displayId: string;
}

export interface AddInfertilityTestRequest {
  infertilityPatientId: number;
  subjectType: "PATIENT" | "SPOUSE";
  subjectNameSnapshot?: string | null;
  selectedTests: string[];
  testCharge: number;
  discountType?: "percentage" | "value" | null;
  discountValue?: number | null;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  orderedById: number;
  doneById?: number | null;
  remarks?: string;
  testDate?: string;
  isCompleted?: boolean;
}

export interface AddInfertilityTestResponse {
  success: boolean;
  data: CreatedInfertilityTestPayload;
  error?: string;
}

export function useAddInfertilityTest(
  options?: Partial<UseMutationOptions<AddInfertilityTestResponse, Error, AddInfertilityTestRequest>>
) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    ...options,
    mutationFn: async (data: AddInfertilityTestRequest): Promise<AddInfertilityTestResponse> => {
      showNotification("Adding HSI Center test...", "loading");
      const response = await api.post<AddInfertilityTestResponse>(
        "/infertility-patients/tests",
        data
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to add HSI Center test");
      }

      return response.data;
    },
    onSuccess: (response, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["infertilityTestPatients"] });
      queryClient.invalidateQueries({ queryKey: ["infertilityPatients"] });
      showNotification("HSI Center test added successfully", "success");
    },
    onError: (error, variables, context) => {
      showNotification(`Failed to add test: ${error.message}`, "error");
    },
  });

  return {
    addTest: mutation.mutate,
    addTestAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    ...mutation,
  };
}
