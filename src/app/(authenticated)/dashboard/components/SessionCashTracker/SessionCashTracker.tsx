"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSessionCashStore } from "../../store";
import { useSessionCashData } from "../../hooks/useSessionCashData";
import { CashTrackerSkeleton } from "./CashTrackerSkeleton";
import { CashTrackerHeader } from "./CashTrackerHeader";
import { CashTrackerFilters } from "./CashTrackerFilters";
import { CashTrackerSummary } from "./CashTrackerSummary";
import { CashTrackerBreakdown } from "./CashTrackerBreakdown";
import { CashTrackerShifts } from "./CashTrackerShifts";
import { generateSessionCashReport } from "./generateCashReport";
import { generateDetailedCashReport } from "./generateDetailedCashReport";
import { api } from "@/lib/axios";
import type { DatePreset, DetailedCashReportData } from "./types";

interface SessionCashTrackerProps {
  staffName?: string;
  isLoading?: boolean;
}

/**
 * Session Cash Tracker Component
 *
 * Displays cash collection data for the current staff member.
 * Shows by Today by default, with options for other time periods.
 * If multiple shifts exist in a day, shows shift count.
 */
export const SessionCashTracker: React.FC<SessionCashTrackerProps> = ({
  staffName: propsStaffName,
  isLoading: propsLoading = false,
}) => {
  // Get state from Zustand store
  const {
    datePreset,
    departmentId,
    departments,
    isDeptDropdownOpen,
    isDateDropdownOpen,
    setDatePreset,
    setDepartmentId,
    setDeptDropdownOpen,
    setDateDropdownOpen,
    setDepartments,
  } = useSessionCashStore();

  // State for detailed report loading
  const [isLoadingDetailedReport, setIsLoadingDetailedReport] = useState(false);

  // Fetch data using the hook
  const {
    data,
    departments: fetchedDepartments,
    isLoading,
    isFetching,
    refetch,
  } = useSessionCashData({
    datePreset,
    departmentId,
  });

  // Update departments in store when fetched
  useEffect(() => {
    if (fetchedDepartments.length > 0 && departments.length === 0) {
      setDepartments(fetchedDepartments);
    }
  }, [fetchedDepartments, departments.length, setDepartments]);

  // Handlers
  const handleDepartmentSelect = useCallback(
    (deptId: number | "all") => {
      setDepartmentId(deptId);
    },
    [setDepartmentId]
  );

  const handleDatePresetSelect = useCallback(
    (preset: DatePreset) => {
      setDatePreset(preset);
    },
    [setDatePreset]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleGenerateReport = useCallback(() => {
    if (!data) return;

    const selectedDept =
      departmentId === "all"
        ? "All Departments"
        : departments.find((d) => d.id === departmentId)?.name || "All";

    generateSessionCashReport({
      staffName: data.staffName,
      generatedAt: format(new Date(), "MMM dd, yyyy hh:mm a"),
      periodLabel: data.periodLabel,
      startDate: format(new Date(data.startDate), "MMM dd, yyyy"),
      endDate: format(new Date(data.endDate), "MMM dd, yyyy"),
      departmentFilter: selectedDept,
      totalCollected: data.totalCollected,
      totalRefunded: data.totalRefunded,
      netCash: data.netCash,
      transactionCount: data.transactionCount,
      departmentBreakdown: data.departmentBreakdown,
      shifts: data.shifts,
    });
  }, [data, departmentId, departments]);

  // Handle detailed report generation
  const handleGenerateDetailedReport = useCallback(async () => {
    if (!data) return;

    setIsLoadingDetailedReport(true);

    try {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.set("datePreset", datePreset);
      if (departmentId && departmentId !== "all") {
        queryParams.set("departmentId", departmentId.toString());
      }

      // Fetch detailed data from API
      const response = await api.get<{
        success: boolean;
        data: DetailedCashReportData;
        error?: string;
      }>(`/dashboard/session-cash/detailed?${queryParams.toString()}`);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch detailed data");
      }

      const detailedData = response.data.data;
      const selectedDept =
        departmentId === "all"
          ? "All Departments"
          : departments.find((d) => d.id === departmentId)?.name || "All";

      // Generate detailed report
      await generateDetailedCashReport({
        staffName: detailedData.staffName,
        generatedAt: format(new Date(), "MMM dd, yyyy hh:mm a"),
        periodLabel: detailedData.periodLabel,
        startDate: format(new Date(detailedData.startDate), "MMM dd, yyyy"),
        endDate: format(new Date(detailedData.endDate), "MMM dd, yyyy"),
        departmentFilter: selectedDept,
        totalCollected: detailedData.totalCollected,
        totalRefunded: detailedData.totalRefunded,
        netCash: detailedData.netCash,
        transactionCount: detailedData.transactionCount,
        departmentBreakdown: detailedData.departmentBreakdown,
        shifts: detailedData.shifts,
      });
    } catch (error) {
      console.error("Error generating detailed report:", error);
      toast.error("Failed to generate detailed report");
    } finally {
      setIsLoadingDetailedReport(false);
    }
  }, [data, datePreset, departmentId, departments]);

  // Show skeleton during initial load or props loading
  if (propsLoading || (isLoading && !data)) {
    return <CashTrackerSkeleton />;
  }

  const cashData = data || {
    totalCollected: 0,
    totalRefunded: 0,
    netCash: 0,
    transactionCount: 0,
    departmentBreakdown: [],
    staffName: propsStaffName || "Staff",
    periodLabel: "Today",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    shiftsCount: 0,
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 h-full hover:shadow-md transition-shadow duration-300 flex flex-col relative">
      {/* Loading overlay when refetching */}
      {isFetching && (
        <div className="absolute inset-0 bg-white/60 rounded-2xl z-10 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-fnh-navy animate-spin" />
        </div>
      )}

      {/* Header */}
      <CashTrackerHeader
        periodLabel={cashData.periodLabel}
        shiftsCount={data?.shiftsCount || 0}
        isFetching={isFetching}
        hasData={!!data}
        isLoadingDetailedReport={isLoadingDetailedReport}
        onGenerateReport={handleGenerateReport}
        onGenerateDetailedReport={handleGenerateDetailedReport}
        onRefresh={handleRefresh}
      />

      {/* Filters */}
      <CashTrackerFilters
        datePreset={datePreset}
        departmentId={departmentId}
        departments={departments}
        isDeptDropdownOpen={isDeptDropdownOpen}
        isDateDropdownOpen={isDateDropdownOpen}
        isFetching={isFetching}
        onDepartmentSelect={handleDepartmentSelect}
        onDatePresetSelect={handleDatePresetSelect}
        onDeptDropdownToggle={() => setDeptDropdownOpen(!isDeptDropdownOpen)}
        onDateDropdownToggle={() => setDateDropdownOpen(!isDateDropdownOpen)}
        onDeptDropdownClose={() => setDeptDropdownOpen(false)}
        onDateDropdownClose={() => setDateDropdownOpen(false)}
      />

      {/* Summary Stats */}
      <CashTrackerSummary
        netCash={cashData.netCash}
        totalCollected={cashData.totalCollected}
        totalRefunded={cashData.totalRefunded}
        transactionCount={cashData.transactionCount}
      />

      {/* Shift Breakdown (shows when multiple shifts or active shift) */}
      <CashTrackerShifts shifts={data?.shifts || []} />

      {/* Department Breakdown */}
      <CashTrackerBreakdown
        departmentBreakdown={cashData.departmentBreakdown}
      />
    </div>
  );
};

export default SessionCashTracker;
