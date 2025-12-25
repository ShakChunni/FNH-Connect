"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";

/**
 * Date preset options for filtering shifts
 */
export type DatePreset = "today" | "yesterday" | "lastWeek" | "lastMonth";

/**
 * Shift data structure returned from the API
 */
export interface AdminShiftData {
  id: number;
  staffId: number;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
  openingCash: number;
  closingCash: number;
  systemCash: number;
  variance: number;
  totalCollected: number;
  totalRefunded: number;
  notes: string | null;
  staff: {
    id: number;
    fullName: string;
    role: string;
  };
  _count: {
    payments: number;
    cashMovements: number;
  };
}

export interface AdminShiftsSummary {
  totalCollected: number;
  totalRefunded: number;
  activeShiftsCount: number;
}

interface AdminShiftsApiResponse {
  success: boolean;
  data: {
    shifts: AdminShiftData[];
    summary: AdminShiftsSummary;
  };
  error?: string;
}

interface UseAdminShiftsOptions {
  datePreset?: DatePreset;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: "Active" | "Closed";
  enabled?: boolean;
}

/**
 * Calculate date range from preset
 */
function getDateRangeFromPreset(preset: DatePreset): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();

  switch (preset) {
    case "today":
      return {
        startDate: startOfDay(now).toISOString().split("T")[0],
        endDate: endOfDay(now).toISOString().split("T")[0],
      };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday).toISOString().split("T")[0],
        endDate: endOfDay(yesterday).toISOString().split("T")[0],
      };
    case "lastWeek":
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      return {
        startDate: lastWeekStart.toISOString().split("T")[0],
        endDate: lastWeekEnd.toISOString().split("T")[0],
      };
    case "lastMonth":
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      return {
        startDate: lastMonthStart.toISOString().split("T")[0],
        endDate: lastMonthEnd.toISOString().split("T")[0],
      };
    default:
      return {
        startDate: startOfDay(now).toISOString().split("T")[0],
        endDate: endOfDay(now).toISOString().split("T")[0],
      };
  }
}

/**
 * Get display label for date preset
 */
export function getDatePresetLabel(preset: DatePreset): string {
  switch (preset) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "lastWeek":
      return "Last Week";
    case "lastMonth":
      return "Last Month";
    default:
      return "Today";
  }
}

/**
 * Hook to fetch admin shifts data for the dashboard
 *
 * Uses /api/dashboard/admin-shifts endpoint which is accessible
 * from the staff dashboard but checks admin role internally.
 */
export function useAdminShiftsData(options: UseAdminShiftsOptions = {}) {
  const {
    datePreset = "today",
    startDate: customStartDate,
    endDate: customEndDate,
    search,
    status,
    enabled = true,
  } = options;

  // Calculate dates from preset or use custom dates
  const dateRange = customStartDate
    ? { startDate: customStartDate, endDate: customEndDate }
    : getDateRangeFromPreset(datePreset);

  // Build query params
  const queryParams = new URLSearchParams();
  if (dateRange.startDate) queryParams.set("startDate", dateRange.startDate);
  if (dateRange.endDate) queryParams.set("endDate", dateRange.endDate);
  if (search) queryParams.set("search", search);
  if (status) queryParams.set("status", status);

  const queryKey = [
    "admin-shifts",
    datePreset,
    dateRange.startDate,
    dateRange.endDate,
    search,
    status,
  ];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<AdminShiftsApiResponse["data"]> => {
      const url = `/dashboard/admin-shifts${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await api.get<AdminShiftsApiResponse>(url);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch shifts data");
      }

      return response.data.data;
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    data: query.data ?? null,
    shifts: query.data?.shifts ?? [],
    summary: query.data?.summary ?? {
      totalCollected: 0,
      totalRefunded: 0,
      activeShiftsCount: 0,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useAdminShiftsData;
