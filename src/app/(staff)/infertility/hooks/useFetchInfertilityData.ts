import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  InfertilityPatient,
  InfertilityFilters,
  FetchInfertilityPatientsResponse,
} from "../types";

export interface PaginatedInfertility {
  data: InfertilityPatient[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useFetchInfertilityData(filters: InfertilityFilters = {}) {
  return useQuery({
    queryKey: ["infertilityPatients", filters],
    queryFn: async (): Promise<PaginatedInfertility> => {
      const params = new URLSearchParams();

      // Add filters
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

      // Add pagination params
      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<FetchInfertilityPatientsResponse>(
        `/infertility-patients?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch infertility patients"
        );
      }

      return {
        data: response.data.data,
        total: response.data.pagination?.total ?? response.data.data.length,
        totalPages: response.data.pagination?.totalPages ?? 1,
        currentPage: response.data.pagination?.page ?? 1,
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
