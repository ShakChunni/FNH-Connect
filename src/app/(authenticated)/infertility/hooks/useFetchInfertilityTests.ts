import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { InfertilityTestData, InfertilityTestFilters } from "../types";

interface FetchInfertilityTestResponse {
  success: boolean;
  data: InfertilityTestData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedInfertilityTest {
  data: InfertilityTestData[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useFetchInfertilityTests(filters: InfertilityTestFilters = {}) {
  return useQuery({
    queryKey: ["infertilityTestPatients", filters],
    queryFn: async (): Promise<PaginatedInfertilityTest> => {
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

      // Status filter - convert to status for API
      if (filters.status && filters.status !== "All") {
        params.append("status", filters.status);
      } else if (filters.status !== undefined) {
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

      // Patient filter (for overview)
      if (filters.infertilityPatientId) {
        params.append("infertilityPatientId", filters.infertilityPatientId.toString());
      }

      // Pagination
      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<FetchInfertilityTestResponse>(
        `/infertility-patients/tests?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch investigations"
        );
      }

      return {
        data: response.data.data,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.page,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
