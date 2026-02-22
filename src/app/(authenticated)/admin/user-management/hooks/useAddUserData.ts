/**
 * Add User Data Hook
 * React Query mutation for creating new users
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type { UserWithStaff, CreateUserInput } from "../types";

interface AddUserResponse {
  success: boolean;
  data: UserWithStaff;
  message?: string;
  error?: string;
}

interface UseAddUserDataOptions {
  onSuccess?: (data: UserWithStaff) => void;
  onError?: (error: Error) => void;
}

export function useAddUserData(options?: UseAddUserDataOptions) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (payload: CreateUserInput): Promise<AddUserResponse> => {
      const response = await api.post<AddUserResponse>(
        "/admin/user-management",
        payload,
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["user-management"],
      });

      showNotification(
        response.message || "User created successfully!",
        "success",
      );

      if (options?.onSuccess && response.data) {
        options.onSuccess(response.data);
      }
    },
    onError: (error: Error) => {
      showNotification(
        error.message || "Failed to create user. Please try again.",
        "error",
      );
      options?.onError?.(error);
    },
  });

  return {
    addUser: mutation.mutate,
    addUserAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}
