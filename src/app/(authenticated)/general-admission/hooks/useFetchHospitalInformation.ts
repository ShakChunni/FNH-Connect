/**
 * Fetch Hospital Information Hook for Admissions
 * Searches hospitals with debounced query
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";
import type { Hospital } from "../types";

interface HospitalSearchResponse {
  success: boolean;
  data: Hospital[];
  error?: string;
}

export function useFetchHospitalInformation(searchQuery: string) {
  const debouncedQuery = useDebounce(searchQuery || "", 200);

  return useQuery({
    queryKey: ["hospitals", "search", debouncedQuery],
    queryFn: async (): Promise<Hospital[]> => {
      if (!debouncedQuery || !debouncedQuery.trim()) {
        return [];
      }

      const response = await api.get<HospitalSearchResponse>("/hospitals", {
        params: {
          search: debouncedQuery.trim(),
          limit: 10,
        },
        timeout: 5000,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch hospitals");
      }

      return response.data.data || [];
    },
    enabled: !!(debouncedQuery && debouncedQuery.trim()),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });
}
