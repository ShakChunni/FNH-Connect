/**
 * Activity Log Details Hook
 * React Query hook for fetching single activity log details
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { ActivityLogDetailResponse, ActivityLogDetail } from "../types";

export function useActivityLogDetails(logId: number | null) {
  return useQuery({
    queryKey: ["activity-log-details", logId],
    queryFn: async (): Promise<ActivityLogDetail> => {
      if (!logId) throw new Error("No log ID provided");

      const response = await api.get<ActivityLogDetailResponse>(
        `/admin/activity-logs/${logId}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch activity log details"
        );
      }

      return response.data.data;
    },
    enabled: !!logId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
