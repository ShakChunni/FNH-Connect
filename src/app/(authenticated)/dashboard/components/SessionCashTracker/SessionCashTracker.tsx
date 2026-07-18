"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { isAdminRole } from "@/lib/roles";
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
import {
  formatBDT,
  formatCalendarDateISO,
  getInclusiveEndDateFromExclusiveUTC,
} from "@/lib/timezone";
import type {
  DatePreset,
  DetailedCashReportData,
  CustomDateRange,
  DepartmentFilter,
} from "./types";

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
  // Notification hook for report generation feedback
  const { showNotification, hideNotification } = useNotification();
  const { user } = useAuth();
  const canSelectStaff = Boolean(user?.role && isAdminRole(user.role));

  // Get state from Zustand store
  const {
    datePreset,
    departmentId,
    staffId,
    departments,
    staffOptions,
    isDeptDropdownOpen,
    isDateDropdownOpen,
    isCustomRangePickerOpen,
    customDateRange,
    setDatePreset,
    setDepartmentId,
    setStaffId,
    setCustomDateRange,
    setDeptDropdownOpen,
    setDateDropdownOpen,
    setCustomRangePickerOpen,
    setDepartments,
    setStaffOptions,
  } = useSessionCashStore();

  // State for detailed report loading
  const [isLoadingDetailedReport, setIsLoadingDetailedReport] = useState(false);

  // Fetch data using the hook
  const {
    data,
    departments: fetchedDepartments,
    staffOptions: fetchedStaffOptions,
    isLoading,
    isFetching,
    refetch,
  } = useSessionCashData({
    datePreset,
    departmentId,
    staffId: canSelectStaff ? staffId : null,
    customDateRange,
  });

  // Update departments in store when fetched
  useEffect(() => {
    const departmentsChanged =
      departments.length !== fetchedDepartments.length ||
      fetchedDepartments.some(
        (department, index) =>
          departments[index]?.id !== department.id ||
          departments[index]?.name !== department.name,
      );

    if (fetchedDepartments.length > 0 && departmentsChanged) {
      setDepartments(fetchedDepartments);
    }
  }, [fetchedDepartments, departments, setDepartments]);

  useEffect(() => {
    if (canSelectStaff) {
      setStaffOptions(fetchedStaffOptions);
    }
  }, [canSelectStaff, fetchedStaffOptions, setStaffOptions]);

  // Handlers
  const handleDepartmentSelect = useCallback(
    (deptId: DepartmentFilter) => {
      setDepartmentId(deptId);
    },
    [setDepartmentId],
  );

  const handleStaffSelect = useCallback(
    (selectedStaffId: number | null) => {
      setStaffId(selectedStaffId);
    },
    [setStaffId],
  );

  const handleDatePresetSelect = useCallback(
    (preset: DatePreset) => {
      setDatePreset(preset);
    },
    [setDatePreset],
  );

  const handleCustomDateRangeSelect = useCallback(
    (range: CustomDateRange | null) => {
      setCustomDateRange(range);
    },
    [setCustomDateRange],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleGenerateReport = useCallback(async () => {
    if (!data) return;

    const loadingId = showNotification("Generating summary report", "loading");

    try {
      const selectedDept =
        departmentId === "all"
          ? "All Departments"
          : departmentId === "admission"
            ? "All Admission Departments"
          : departments.find((d) => d.id === departmentId)?.name || "All";

      await generateSessionCashReport({
        staffName: data.staffName,
        generatedAt: formatBDT(new Date(), "MMM dd, yyyy hh:mm a"),
        periodLabel: data.periodLabel,
        startDate: formatBDT(data.startDate, "MMM dd, yyyy"),
        endDate: formatBDT(
          getInclusiveEndDateFromExclusiveUTC(data.endDate),
          "MMM dd, yyyy",
        ),
        departmentFilter: selectedDept,
        totalCollected: data.totalCollected,
        totalRefunded: data.totalRefunded,
        netCash: data.netCash,
        transactionCount: data.transactionCount,
        departmentBreakdown: data.departmentBreakdown,
        shifts: data.shifts,
      });

      hideNotification(loadingId);
      showNotification("Summary report generated successfully", "success");
    } catch (error) {
      hideNotification(loadingId);
      showNotification("Failed to generate summary report", "error");
      console.error("Error generating summary report:", error);
    }
  }, [data, departmentId, departments, showNotification, hideNotification]);

  // Handle detailed report generation
  const handleGenerateDetailedReport = useCallback(async () => {
    if (!data) return;

    setIsLoadingDetailedReport(true);
    const loadingId = showNotification("Generating detailed report", "loading");

    try {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.set("datePreset", datePreset);
      if (departmentId && departmentId !== "all") {
        queryParams.set("departmentId", String(departmentId));
      }
      if (canSelectStaff && staffId) {
        queryParams.set("staffId", staffId.toString());
      }
      // Add custom date range parameters if using custom preset
      if (
        datePreset === "custom" &&
        customDateRange?.from &&
        customDateRange?.to
      ) {
        queryParams.set("startDate", formatCalendarDateISO(customDateRange.from));
        queryParams.set("endDate", formatCalendarDateISO(customDateRange.to));
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
          : departmentId === "admission"
            ? "All Admission Departments"
          : departments.find((d) => d.id === departmentId)?.name || "All";

      // Generate detailed report
      await generateDetailedCashReport({
        staffName: detailedData.staffName,
        generatedAt: formatBDT(new Date(), "MMM dd, yyyy hh:mm a"),
        periodLabel: detailedData.periodLabel,
        startDate: formatBDT(detailedData.startDate, "MMM dd, yyyy"),
        endDate: formatBDT(
          getInclusiveEndDateFromExclusiveUTC(detailedData.endDate),
          "MMM dd, yyyy",
        ),
        departmentFilter: selectedDept,
        totalCollected: detailedData.totalCollected,
        totalRefunded: detailedData.totalRefunded,
        netCash: detailedData.netCash,
        transactionCount: detailedData.transactionCount,
        departmentBreakdown: detailedData.departmentBreakdown,
        shifts: detailedData.shifts,
      });

      hideNotification(loadingId);
      showNotification("Detailed report generated successfully", "success");
    } catch (error) {
      console.error("Error generating detailed report:", error);
      hideNotification(loadingId);
      showNotification("Failed to generate detailed report", "error");
    } finally {
      setIsLoadingDetailedReport(false);
    }
  }, [
    data,
    datePreset,
    departmentId,
    staffId,
    canSelectStaff,
    departments,
    customDateRange,
    showNotification,
    hideNotification,
  ]);

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
    selectedStaffId: user?.staffId,
    canSelectStaff,
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
        staffId={canSelectStaff ? staffId : null}
        departments={departments}
        staffOptions={staffOptions}
        selectedStaffId={data?.selectedStaffId ?? user?.staffId ?? null}
        canSelectStaff={canSelectStaff}
        isDeptDropdownOpen={isDeptDropdownOpen}
        isDateDropdownOpen={isDateDropdownOpen}
        isCustomRangePickerOpen={isCustomRangePickerOpen}
        customDateRange={customDateRange}
        isFetching={isFetching}
        onStaffSelect={handleStaffSelect}
        onDepartmentSelect={handleDepartmentSelect}
        onDatePresetSelect={handleDatePresetSelect}
        onCustomDateRangeSelect={handleCustomDateRangeSelect}
        onDeptDropdownToggle={() => setDeptDropdownOpen(!isDeptDropdownOpen)}
        onDateDropdownToggle={() => setDateDropdownOpen(!isDateDropdownOpen)}
        onCustomRangePickerToggle={() =>
          setCustomRangePickerOpen(!isCustomRangePickerOpen)
        }
        onDeptDropdownClose={() => setDeptDropdownOpen(false)}
        onDateDropdownClose={() => setDateDropdownOpen(false)}
        onCustomRangePickerClose={() => setCustomRangePickerOpen(false)}
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
