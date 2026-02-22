/**
 * Update Group Data Hook
 * React Query mutation for editing medicine groups
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { MedicineGroup, UpdateGroupInput } from "../types";

interface UpdateGroupResponse {
  success: boolean;
  data: MedicineGroup;
  message?: string;
  error?: string;
}

interface UpdateGroupPayload {
  id: number;
  data: UpdateGroupInput;
}

interface UseUpdateGroupDataOptions {
  onSuccess?: (data: MedicineGroup) => void;
  onError?: (error: Error) => void;
}

export function useUpdateGroupData(options?: UseUpdateGroupDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (
      payload: UpdateGroupPayload,
    ): Promise<UpdateGroupResponse> => {
      const response = await api.patch<UpdateGroupResponse>(
        `/medicine-inventory/groups/${payload.id}`,
        payload.data,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });

      showNotification(
        response.message || "Group updated successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to update group. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    updateGroup: mutation.mutate,
    updateGroupAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
