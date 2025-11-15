import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useAuth } from "@/app/AuthContext";
import { useState, useEffect } from "react";
import type { InfertilityPatientBasic } from "../../../types";

export function useFetchPatientInformation(searchQuery: string) {
  const { user } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return useQuery({
    queryKey: ["infertilityPatients", "search", debouncedQuery],
    queryFn: async (): Promise<InfertilityPatientBasic[]> => {
      if (!debouncedQuery.trim() || !user?.username) {
        return [];
      }

      const response = await api.get<InfertilityPatientBasic[]>(
        "/infertility-patients/search",
        {
          params: {
            query: debouncedQuery.trim(),
            searchBy: "both",
            username: user.username,
            userRole: user.role,
          },
          timeout: 5000,
        }
      );

      return response.data || [];
    },
    enabled: !!debouncedQuery.trim() && !!user?.username,
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
