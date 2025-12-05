import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useState, useEffect } from "react";
import type { Hospital } from "@/app/infertility/types";

export function useFetchHospitalInformation(searchQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery || "");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery || ""), 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return useQuery({
    queryKey: ["hospitals", "search", debouncedQuery],
    queryFn: async (): Promise<Hospital[]> => {
      if (!debouncedQuery || !debouncedQuery.trim()) {
        return [];
      }

      const response = await api.get<{
        success: boolean;
        data: Hospital[];
        error?: string;
      }>("/hospitals", {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });
}
