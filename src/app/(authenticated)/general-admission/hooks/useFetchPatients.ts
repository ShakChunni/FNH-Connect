/**
 * Fetch Patients Hook for Admissions
 * Searches patients with debounced query
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";
import type { Patient } from "../types";

interface PatientSearchResponse {
  success: boolean;
  data: Patient[];
  error?: string;
}

export function useFetchPatients(searchQuery: string) {
  const debouncedQuery = useDebounce(searchQuery || "", 200);

  return useQuery({
    queryKey: ["patients", "search", debouncedQuery],
    queryFn: async (): Promise<Patient[]> => {
      if (!debouncedQuery || !debouncedQuery.trim()) {
        return [];
      }

      const response = await api.get<PatientSearchResponse>(
        "/patient-records",
        {
          params: { search: debouncedQuery.trim() },
          timeout: 5000,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch patients");
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
