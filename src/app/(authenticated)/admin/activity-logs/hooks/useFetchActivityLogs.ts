/**
 * Fetch Activity Logs Hook
 * React Query hook for fetching activity logs with filters
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { ActivityLogsResponse, ActivityLogFilters } from "../types";

export interface PaginatedActivityLogs {
  logs: ActivityLogsResponse["data"]["logs"];
  pagination: ActivityLogsResponse["data"]["pagination"];
  summary: ActivityLogsResponse["data"]["summary"];
  filterOptions: ActivityLogsResponse["data"]["filterOptions"];
}

export function useFetchActivityLogs(
  filters: Partial<ActivityLogFilters> = {}
) {
  return useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: async (): Promise<PaginatedActivityLogs> => {
      const params = new URLSearchParams();

      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.action && filters.action !== "All") {
        params.append("action", filters.action);
      }

      if (filters.userId) {
        params.append("userId", filters.userId.toString());
      }

      if (filters.entityType && filters.entityType !== "All") {
        params.append("entityType", filters.entityType);
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const response = await api.get<ActivityLogsResponse>(
        `/admin/activity-logs?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch activity logs");
      }

      return {
        logs: response.data.data.logs,
        pagination: response.data.data.pagination,
        summary: response.data.data.summary,
        filterOptions: response.data.data.filterOptions,
      };
    },

    staleTime: 1 * 60 * 1000, // 1 minute
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
