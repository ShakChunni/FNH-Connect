/**
 * Fetch Admissions Hook
 * React Query hook for fetching admissions with filters
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AdmissionFilters, AdmissionPatientData } from "../types";

interface FetchAdmissionsResponse {
  success: boolean;
  data: AdmissionPatientData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedAdmissions {
  data: AdmissionPatientData[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useFetchAdmissions(filters: AdmissionFilters = {}) {
  return useQuery({
    queryKey: ["admissions", filters],
    queryFn: async (): Promise<PaginatedAdmissions> => {
      const params = new URLSearchParams();

      if (filters.status && filters.status !== "All") {
        params.append("status", filters.status);
      }

      if (filters.departmentId) {
        params.append("departmentId", filters.departmentId.toString());
      }

      if (filters.doctorId) {
        params.append("doctorId", filters.doctorId.toString());
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

      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<FetchAdmissionsResponse>(
        `/admissions?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch admissions");
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
