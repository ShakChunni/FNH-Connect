import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";

export interface AddInfertilityTestRequest {
  infertilityPatientId: number;
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
  data: any;
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
      showNotification("Adding infertility test...", "loading");
      const response = await api.post<{ success: boolean; data: any; error?: string }>(
        "/infertility-patients/tests",
        data
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to add infertility test");
      }

      return response.data;
    },
    onSuccess: (response, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["infertilityTestPatients"] });
      queryClient.invalidateQueries({ queryKey: ["infertilityPatients"] });
      showNotification("Infertility test added successfully", "success");
      if (options?.onSuccess) {
        options.onSuccess(response, variables, context as any, mutation as any);
      }
    },
    onError: (error, variables, context) => {
      showNotification(`Failed to add test: ${error.message}`, "error");
      if (options?.onError) {
        options.onError(error, variables, context as any, mutation as any);
      }
    },
  });

  return {
    addTest: mutation.mutate,
    addTestAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    ...mutation,
  };
}
