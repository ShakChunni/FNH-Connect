import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  PathologyPatient,
  PathologyFilters,
  FetchPathologyPatientsResponse,
} from "../types";

export function useFetchPathologyData(filters: PathologyFilters = {}) {
  return useQuery({
    queryKey: ["pathologyPatients", filters],
    queryFn: async (): Promise<PathologyPatient[]> => {
      const params = new URLSearchParams();

      // Add filters
      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      if (filters.isCompleted !== undefined) {
        params.append("isCompleted", filters.isCompleted.toString());
      }

      if (filters.testCategory) {
        params.append("testCategory", filters.testCategory);
      }

      const response = await api.get<FetchPathologyPatientsResponse>(
        `/pathology-patients?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch pathology patients"
        );
      }

      return response.data.data;
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
