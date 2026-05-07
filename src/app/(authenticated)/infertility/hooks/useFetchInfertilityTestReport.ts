/**
 * Fetch InfertilityTest Report Data Hook
 * React Query mutation hook for fetching all infertilityTest data for report generation
 * Uses mutation pattern since it's on-demand, not continuous fetching
 */

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { InfertilityTestData, InfertilityTestFilters } from "../types";

interface FetchReportResponse {
  success: boolean;
  data: InfertilityTestData[];
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
 * Hook to fetch all infertilityTest data for report generation
 * This fetches ALL matching records, not paginated
 */
export function useFetchInfertilityTestReport() {
  return useMutation({
    mutationFn: async (
      filters: FetchReportDataParams
    ): Promise<InfertilityTestData[]> => {
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
      } else if (filters.status === "All") {
        params.append("status", filters.status);
      }

      // Test name filters (multi-select)
      if (filters.testNames && filters.testNames.length > 0) {
        filters.testNames.forEach((testName) => {
          params.append("testNames[]", testName);
        });
      }

      // Doctor/Staff filters
      if (filters.orderedById) {
        params.append("orderedById", filters.orderedById.toString());
      }

      if (filters.doneById) {
        params.append("doneById", filters.doneById.toString());
      }

      const response = await api.get<FetchReportResponse>(
        `/infertility-patients/tests/report?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch infertilityTest data for report"
        );
      }

      return response.data.data;
    },
  });
}
