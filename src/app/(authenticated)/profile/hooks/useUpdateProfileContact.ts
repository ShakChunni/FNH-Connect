/**
 * Update Profile Contact Hook
 * React Query mutation for changing the authenticated user's own email/phone.
 */

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/axios";

export interface UpdateProfileContactPayload {
  email: string;
  phoneNumber: string;
}

interface UpdateProfileContactSuccessResponse {
  success: true;
  message: string;
  data: {
    email: string | null;
    phoneNumber: string | null;
  };
}

interface UpdateProfileContactErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

interface UseUpdateProfileContactOptions {
  onSuccess?: (data: UpdateProfileContactSuccessResponse) => void;
  onError?: (error: Error) => void;
}

function getErrorMessage(error: Error): string {
  if (axios.isAxiosError<UpdateProfileContactErrorResponse>(error)) {
    const details = error.response?.data?.details;
    const fieldErrors = details
      ? Object.values(details).flat().filter(Boolean)
      : [];

    return (
      fieldErrors[0] ||
      error.response?.data?.error ||
      "Failed to update profile. Please try again."
    );
  }

  return error.message || "Failed to update profile. Please try again.";
}

export function useUpdateProfileContact(
  options?: UseUpdateProfileContactOptions,
) {
  const mutation = useMutation<
    UpdateProfileContactSuccessResponse,
    Error,
    UpdateProfileContactPayload
  >({
    mutationFn: async (payload) => {
      const response = await api.patch<UpdateProfileContactSuccessResponse>(
        "/profile",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(new Error(getErrorMessage(error)));
    },
  });

  return {
    updateProfileContact: mutation.mutate,
    updateProfileContactAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    data: mutation.data,
  };
}
