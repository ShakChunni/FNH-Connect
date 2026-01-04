/**
 * Fetch Admissions Report Data Hook
 * React Query mutation hook for fetching all admissions data for report generation
 * Uses mutation pattern since it's on-demand, not continuous fetching
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { AdmissionPatientData, AdmissionFilters } from "../types";

interface FetchReportResponse {
  success: boolean;
  data: AdmissionPatientData[];
  total: number;
  error?: string;
}

export interface FetchAdmissionReportParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  departmentId?: number;
  doctorId?: number;
}

/**
 * Hook to fetch all admissions data for report generation
 * This fetches ALL matching records, not paginated
 */
export function useFetchAdmissionsReportData() {
  return useMutation({
    mutationFn: async (
      filters: FetchAdmissionReportParams
    ): Promise<AdmissionPatientData[]> => {
      const params = new URLSearchParams();

      // Search filter
      if (filters.search) {
        params.append("search", filters.search);
      }

      // Date range filters
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      // Status filter
      if (filters.status && filters.status !== "All") {
        params.append("status", filters.status);
      }

      // Department filter
      if (filters.departmentId) {
        params.append("departmentId", filters.departmentId.toString());
      }

      // Doctor filter
      if (filters.doctorId) {
        params.append("doctorId", filters.doctorId.toString());
      }

      const response = await api.get<FetchReportResponse>(
        `/admissions/report?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch admissions data for report"
        );
      }

      return response.data.data;
    },
  });
}
