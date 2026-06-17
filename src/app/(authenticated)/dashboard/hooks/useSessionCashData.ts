"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  DatePreset,
  SessionCashData,
  Department,
  DepartmentCashBreakdown,
  ShiftSummary,
  CustomDateRange,
  CashTrackerStaffOption,
} from "../components/SessionCashTracker/types";
import { formatCalendarDateISO } from "@/lib/timezone";

interface SessionCashApiResponse {
  success: boolean;
  data: {
    totalCollected: number;
    totalRefunded: number;
    netCash: number;
    transactionCount: number;
    departmentBreakdown: DepartmentCashBreakdown[];
    shifts: ShiftSummary[];
    staffName: string;
    periodLabel: string;
    startDate: string;
    endDate: string;
    shiftsCount: number;
    departments: Department[];
    staffOptions: CashTrackerStaffOption[];
    selectedStaffId: number;
    canSelectStaff: boolean;
  };
  error?: string;
}

interface UseSessionCashDataOptions {
  datePreset: DatePreset;
  departmentId: number | "all";
  staffId?: number | null;
  customDateRange?: CustomDateRange | null;
}

export interface SessionCashDataResult extends SessionCashData {
  departments: Department[];
  staffOptions: CashTrackerStaffOption[];
  shiftsCount: number;
  selectedStaffId: number;
  canSelectStaff: boolean;
}

export function useSessionCashData({
  datePreset,
  departmentId,
  staffId,
  customDateRange,
}: UseSessionCashDataOptions) {
  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set("datePreset", datePreset);

  if (departmentId && departmentId !== "all") {
    queryParams.set("departmentId", departmentId.toString());
  }

  if (staffId) {
    queryParams.set("staffId", staffId.toString());
  }

  // Add custom date range parameters if using custom preset
  if (datePreset === "custom" && customDateRange?.from && customDateRange?.to) {
    queryParams.set("startDate", formatCalendarDateISO(customDateRange.from));
    queryParams.set("endDate", formatCalendarDateISO(customDateRange.to));
  }

  const queryKey = [
    "session-cash",
    datePreset,
    departmentId,
    staffId ?? null,
    datePreset === "custom" && customDateRange?.from
      ? formatCalendarDateISO(customDateRange.from)
      : null,
    datePreset === "custom" && customDateRange?.to
      ? formatCalendarDateISO(customDateRange.to)
      : null,
  ];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SessionCashDataResult> => {
      const response = await api.get<SessionCashApiResponse>(
        `/dashboard/session-cash?${queryParams.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch session cash data",
        );
      }

      return {
        totalCollected: response.data.data.totalCollected,
        totalRefunded: response.data.data.totalRefunded,
        netCash: response.data.data.netCash,
        transactionCount: response.data.data.transactionCount,
        departmentBreakdown: response.data.data.departmentBreakdown,
        shifts: response.data.data.shifts,
        staffName: response.data.data.staffName,
        periodLabel: response.data.data.periodLabel,
        startDate: response.data.data.startDate,
        endDate: response.data.data.endDate,
        departments: response.data.data.departments,
        staffOptions: response.data.data.staffOptions,
        shiftsCount: response.data.data.shiftsCount,
        selectedStaffId: response.data.data.selectedStaffId,
        canSelectStaff: response.data.data.canSelectStaff,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    // Only fetch when we have valid custom range for custom preset
    enabled:
      datePreset !== "custom" ||
      (customDateRange?.from !== undefined &&
        customDateRange?.to !== undefined),
  });

  return {
    data: query.data ?? null,
    departments: query.data?.departments ?? [],
    staffOptions: query.data?.staffOptions ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useSessionCashData;
