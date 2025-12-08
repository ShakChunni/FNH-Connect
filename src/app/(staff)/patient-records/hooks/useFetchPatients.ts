"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  PatientData,
  PatientFilters,
  PatientsApiResponse,
  PatientUpdateRequest,
} from "../types";

// ============================================
// Fetch All Patients Hook
// ============================================

export function useFetchPatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: async (): Promise<PatientData[]> => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const queryString = params.toString();
      const url = `/patient-records${queryString ? `?${queryString}` : ""}`;

      const response = await api.get<PatientsApiResponse>(url);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch patients");
      }

      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Update Patient Hook
// ============================================

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: PatientUpdateRequest;
    }) => {
      const response = await api.patch(`/patient-records/${id}`, data);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update patient");
      }

      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate patients query to refetch
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export default useFetchPatients;
