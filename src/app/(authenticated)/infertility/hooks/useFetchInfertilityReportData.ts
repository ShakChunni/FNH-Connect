/**
 * Fetch Infertility Report Data Hook
 * Fetches all infertility data for report generation, bypassing pagination
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  InfertilityPatient,
  InfertilityFilters,
  FetchInfertilityPatientsResponse,
} from "../types";

interface FetchReportDataOptions {
  filters?: Omit<InfertilityFilters, "page" | "limit">;
  enabled?: boolean;
}

export function useFetchInfertilityReportData(
  options: FetchReportDataOptions = {}
) {
  const { filters = {}, enabled = false } = options;

  return useQuery({
    queryKey: ["infertilityReportData", filters],
    queryFn: async (): Promise<InfertilityPatient[]> => {
      const params = new URLSearchParams();

      // Add filters (but no pagination - fetch all)
      if (filters.status) {
        params.append("status", filters.status);
      }

      if (filters.hospitalId) {
        params.append("hospitalId", filters.hospitalId.toString());
      }

      if (filters.infertilityType) {
        params.append("infertilityType", filters.infertilityType);
      }

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      if (filters.testNames && filters.testNames.length > 0) {
        params.append("testNames", filters.testNames.join("|"));
      }

      // Fetch a large limit to get all records for report
      params.append("limit", "10000");

      const response = await api.get<FetchInfertilityPatientsResponse>(
        `/infertility-patients/report?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch HSI Center report data"
        );
      }

      return response.data.data;
    },
    enabled, // Only run when explicitly enabled
    staleTime: 0, // Always refetch for reports
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
