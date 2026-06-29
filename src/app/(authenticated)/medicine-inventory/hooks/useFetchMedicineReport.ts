/**
 * Fetch Medicine Inventory Report Hook
 * React Query hook for fetching the consolidated print report
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicineInventoryReport } from "../types";

interface ReportResponse {
  success: boolean;
  data: MedicineInventoryReport;
  error?: string;
}

export function useFetchMedicineReport(
  startDate?: string,
  endDate?: string,
  enabled = false,
) {
  return useQuery({
    queryKey: ["medicine-inventory", "report", startDate, endDate],
    queryFn: async (): Promise<MedicineInventoryReport> => {
      const params = new URLSearchParams();

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const url = params.toString()
        ? `/medicine-inventory/report?${params.toString()}`
        : "/medicine-inventory/report";

      const response = await api.get<ReportResponse>(url);

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch medicine inventory report",
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
    refetchOnMount: false,
    enabled,
  });
}
