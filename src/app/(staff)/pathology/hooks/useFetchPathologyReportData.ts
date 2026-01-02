/**
 * Fetch Pathology Report Data Hook
 * React Query mutation hook for fetching all pathology data for report generation
 * Uses mutation pattern since it's on-demand, not continuous fetching
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { PathologyPatient, PathologyFilters } from "../types";

interface FetchReportResponse {
  success: boolean;
  data: PathologyPatient[];
  total: number;
  error?: string;
}

export interface FetchReportDataParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  testNames?: string[];
  orderedById?: number;
  doneById?: number;
}

/**
 * Hook to fetch all pathology data for report generation
 * This fetches ALL matching records, not paginated
 */
export function useFetchPathologyReportData() {
  return useMutation({
    mutationFn: async (
      filters: FetchReportDataParams
    ): Promise<PathologyPatient[]> => {
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

      // Status filter - convert to isCompleted for API
      if (filters.status && filters.status !== "All") {
        params.append(
          "isCompleted",
          (filters.status === "Completed").toString()
        );
      }

      // Test name filters (multi-select)
      if (filters.testNames && filters.testNames.length > 0) {
        params.append("testNames", filters.testNames.join("|"));
      }

      // Doctor/Staff filters
      if (filters.orderedById) {
        params.append("orderedById", filters.orderedById.toString());
      }

      if (filters.doneById) {
        params.append("doneById", filters.doneById.toString());
      }

      const response = await api.get<FetchReportResponse>(
        `/pathology-patients/report?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch pathology data for report"
        );
      }

      return response.data.data;
    },
  });
}
