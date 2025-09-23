"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useCallback, useMemo } from "react";
import type {
  AddInfertilityPatientRequest,
  AddInfertilityPatientResponse,
} from "@/types/infertility";

// Custom error type for better error handling
interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// Hook configuration options
interface UseAddInfertilityDataOptions {
  onSuccess?: (data: AddInfertilityPatientResponse["data"]) => void;
  onError?: (error: ApiError) => void;
  invalidateQueries?: boolean; // Whether to invalidate related queries after success
}

// Return type for the hook
interface UseAddInfertilityDataReturn {
  addPatient: (
    data: AddInfertilityPatientRequest
  ) => Promise<AddInfertilityPatientResponse["data"]>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiError | null;
  reset: () => void;
}

/**
 * Custom hook for adding infertility patients
 * Provides optimistic updates, error handling, and cache invalidation
 */
export const useAddInfertilityData = (
  options: UseAddInfertilityDataOptions = {}
): UseAddInfertilityDataReturn => {
  const { onSuccess, onError, invalidateQueries = true } = options;

  const queryClient = useQueryClient();

  // Configure axios instance with default settings
  const apiClient = useMemo(() => {
    const client = axios.create({
      timeout: 30000, // 30 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for logging
    client.interceptors.request.use(
      (config) => {
        console.log("[API Request]", config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    client.interceptors.response.use(
      (response) => {
        console.log("[API Response]", response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error("[API Response Error]", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    return client;
  }, []);

  // Mutation function
  const addPatientMutation = useMutation({
    mutationFn: async (
      data: AddInfertilityPatientRequest
    ): Promise<AddInfertilityPatientResponse> => {
      try {
        const response = await apiClient.post<AddInfertilityPatientResponse>(
          "/api/infertility-patients/add",
          data
        );

        if (!response.data.success) {
          throw new Error(response.data.error || "Failed to add patient");
        }

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<AddInfertilityPatientResponse>;

          // Handle different error scenarios
          if (axiosError.response) {
            // Server responded with error status
            const errorData = axiosError.response.data;
            const apiError: ApiError = {
              success: false,
              error: errorData?.error || "Server error occurred",
              message:
                errorData?.message || "Failed to add infertility patient",
              statusCode: axiosError.response.status,
            };
            throw apiError;
          } else if (axiosError.request) {
            // Network error - no response received
            const networkError: ApiError = {
              success: false,
              error: "Network error",
              message:
                "Unable to connect to server. Please check your internet connection.",
              statusCode: 0,
            };
            throw networkError;
          } else {
            // Request setup error
            const requestError: ApiError = {
              success: false,
              error: "Request configuration error",
              message: axiosError.message || "Failed to send request",
              statusCode: 0,
            };
            throw requestError;
          }
        } else {
          // Non-axios error
          const genericError: ApiError = {
            success: false,
            error: "Unknown error",
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
            statusCode: 500,
          };
          throw genericError;
        }
      }
    },
    onSuccess: (response) => {
      console.log("[Mutation Success]", response);

      // Invalidate and refetch related queries
      if (invalidateQueries) {
        queryClient.invalidateQueries({
          queryKey: ["infertilityPatients"],
          refetchType: "active",
        });

        // Also invalidate patient search queries if they exist
        queryClient.invalidateQueries({
          queryKey: ["patientSearch"],
          refetchType: "active",
        });

        // Invalidate hospital queries
        queryClient.invalidateQueries({
          queryKey: ["hospitalSearch"],
          refetchType: "active",
        });
      }

      // Call success callback if provided
      if (onSuccess && response.data) {
        onSuccess(response.data);
      }
    },
    onError: (error: ApiError) => {
      console.error("[Mutation Error]", error);

      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    },
    // Retry configuration
    retry: (failureCount, error: ApiError) => {
      // Don't retry on client errors (4xx) or authentication errors
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return false;
      }
      // Retry up to 2 times for server errors (5xx) or network errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Memoized add function to prevent unnecessary re-renders
  const addPatient = useCallback(
    async (data: AddInfertilityPatientRequest) => {
      const result = await addPatientMutation.mutateAsync(data);
      return result.data!;
    },
    [addPatientMutation]
  );

  // Transform error to our custom format
  const transformedError = useMemo((): ApiError | null => {
    if (!addPatientMutation.error) return null;

    // If it's already our custom error type, return as is
    if (
      typeof addPatientMutation.error === "object" &&
      "statusCode" in addPatientMutation.error
    ) {
      return addPatientMutation.error as ApiError;
    }

    // Transform generic error to our format
    const error = addPatientMutation.error as any;
    const errorMessage = error?.message || "An unexpected error occurred";

    return {
      success: false,
      error: "Unknown error",
      message: errorMessage,
      statusCode: 500,
    };
  }, [addPatientMutation.error]);

  return {
    addPatient,
    isLoading: addPatientMutation.isPending,
    isSuccess: addPatientMutation.isSuccess,
    isError: addPatientMutation.isError,
    error: transformedError,
    reset: addPatientMutation.reset,
  };
};

// Export default for easier imports
export default useAddInfertilityData;
