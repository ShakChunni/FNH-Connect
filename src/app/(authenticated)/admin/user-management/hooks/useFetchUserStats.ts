/**
 * Fetch User Stats Hook
 * React Query hook for fetching user management statistics
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { UserManagementStats } from "../types";

interface StatsResponse {
  success: boolean;
  data: UserManagementStats;
  error?: string;
}

export function useFetchUserStats() {
  return useQuery({
    queryKey: ["user-management", "stats"],
    queryFn: async (): Promise<UserManagementStats> => {
      const response = await api.get<StatsResponse>(
        "/admin/user-management/stats",
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch stats");
      }

      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
