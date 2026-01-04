import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { PathologyPatient, PathologyFilters } from "../types";

interface FetchPathologyResponse {
  success: boolean;
  data: PathologyPatient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedPathology {
  data: PathologyPatient[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useFetchPathologyData(filters: PathologyFilters = {}) {
  return useQuery({
    queryKey: ["pathologyPatients", filters],
    queryFn: async (): Promise<PaginatedPathology> => {
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
      } else if (filters.isCompleted !== undefined) {
        params.append("isCompleted", filters.isCompleted.toString());
      }

      // Test name filters (multi-select)
      if (filters.testNames && filters.testNames.length > 0) {
        params.append("testNames", filters.testNames.join("|"));
      } else if (filters.testCategory) {
        // Legacy single category support
        params.append("testCategory", filters.testCategory);
      }

      // Doctor/Staff filters
      if (filters.orderedById) {
        params.append("orderedById", filters.orderedById.toString());
      }

      if (filters.doneById) {
        params.append("doneById", filters.doneById.toString());
      }

      // Pagination
      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<FetchPathologyResponse>(
        `/pathology-patients?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch pathology patients"
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
