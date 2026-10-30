"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { DashboardData } from "../types";

// ============================================
// Single Dashboard Data Hook (RESTful)
// ============================================

interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
  error?: string;
}

export function useDashboardData() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const response = await api.get<DashboardApiResponse>("/dashboard");
      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch dashboard data",
        );
      }
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  return {
    stats: query.data?.stats ?? null,
    recentPatients: query.data?.recentPatients ?? [],
    cashSession: query.data?.cashSession ?? null,
    patientCreationStats: query.data?.patientCreationStats ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useDashboardData;
