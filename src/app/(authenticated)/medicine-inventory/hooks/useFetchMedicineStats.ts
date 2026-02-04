/**
 * Fetch Medicine Inventory Stats Hook
 * React Query hook for fetching dashboard statistics
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicineInventoryStats, LowStockItem } from "../types";

interface StatsResponse {
  success: boolean;
  data: {
    stats: MedicineInventoryStats;
    lowStockItems: LowStockItem[];
  };
  error?: string;
}

export interface MedicineStatsData {
  stats: MedicineInventoryStats | undefined;
  lowStockItems: LowStockItem[];
}

export function useFetchMedicineStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["medicine-inventory", "stats", startDate, endDate],
    queryFn: async (): Promise<MedicineStatsData> => {
      const params = new URLSearchParams();

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const url = params.toString()
        ? `/medicine-inventory?${params.toString()}`
        : "/medicine-inventory";

      const response = await api.get<StatsResponse>(url);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch stats");
      }

      return {
        stats: response.data.data.stats,
        lowStockItems: response.data.data.lowStockItems || [],
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
