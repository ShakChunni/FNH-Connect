"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/app/AuthContext";
import { CashTrackerHeader } from "@/app/(authenticated)/dashboard/components/SessionCashTracker/CashTrackerHeader";
import { CashTrackerSummary } from "@/app/(authenticated)/dashboard/components/SessionCashTracker/CashTrackerSummary";
import { CashTrackerShifts } from "@/app/(authenticated)/dashboard/components/SessionCashTracker/CashTrackerShifts";
import { generateSessionCashReport } from "@/app/(authenticated)/dashboard/components/SessionCashTracker/generateCashReport";
import { generateDetailedCashReport } from "@/app/(authenticated)/dashboard/components/SessionCashTracker/generateDetailedCashReport";
import type {
  CashReportBranding,
  CustomDateRange,
  DatePreset,
  DetailedCashReportData,
  ShiftSummary,
} from "@/app/(authenticated)/dashboard/components/SessionCashTracker/types";
import { StaffFilter } from "@/components/ui/StaffFilter";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import {
  formatBDT,
  formatCalendarDateISO,
  formatCalendarPartsISO,
  getTodayBDTCalendarDateParts,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/roles";
import { useInfertilityCashTrackingShifts } from "../cash-tracking/hooks";
import type { DetailedShift } from "../cash-tracking/types";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";

interface DateRangeState {
  from?: Date;
  to?: Date;
}

interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "lastWeek", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastCalendarMonth", label: "Last Month" },
  { value: "last30Days", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const HSI_CASH_REPORT_BRANDING: CashReportBranding = {
  name: "HSI Center",
  address:
    "1257, Sholakia, Khorompatti Kishoreganj Sadar, Kishoreganj Dhaka, Bangladesh",
  phone: "Mobile: +8801726219350, +8801701295016, +8801787993086",
  department: "HSI Center",
  logoPath: "/hsi-logo.png",
  thankYouText: "Thank you for choosing HSI Center",
};

const addDays = (parts: CalendarDateParts, days: number): CalendarDateParts => {
  const result = new Date(Date.UTC(parts.year, parts.month, parts.day + days));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth(),
    day: result.getUTCDate(),
  };
};

const getPresetRange = (
  datePreset: DatePreset,
  customDateRange: CustomDateRange | null,
) => {
  if (
    datePreset === "custom" &&
    customDateRange?.from &&
    customDateRange.to
  ) {
    return {
      startDate: formatCalendarDateISO(customDateRange.from),
      endDate: formatCalendarDateISO(customDateRange.to),
      label: `${format(customDateRange.from, "MMM dd")} - ${format(
        customDateRange.to,
        "MMM dd",
      )}`,
    };
  }

  const today = getTodayBDTCalendarDateParts();

  switch (datePreset) {
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return {
        startDate: formatCalendarPartsISO(yesterday),
        endDate: formatCalendarPartsISO(yesterday),
        label: "Yesterday",
      };
    }
    case "lastWeek": {
      return {
        startDate: formatCalendarPartsISO(addDays(today, -6)),
        endDate: formatCalendarPartsISO(today),
        label: "Last 7 Days",
      };
    }
    case "thisMonth": {
      return {
        startDate: formatCalendarPartsISO({
          year: today.year,
          month: today.month,
          day: 1,
        }),
        endDate: formatCalendarPartsISO(today),
        label: "This Month",
      };
    }
    case "lastCalendarMonth": {
      const lastMonthEnd = new Date(Date.UTC(today.year, today.month, 0));
      return {
        startDate: formatCalendarPartsISO({
          year: lastMonthEnd.getUTCFullYear(),
          month: lastMonthEnd.getUTCMonth(),
          day: 1,
        }),
        endDate: formatCalendarPartsISO({
          year: lastMonthEnd.getUTCFullYear(),
          month: lastMonthEnd.getUTCMonth(),
          day: lastMonthEnd.getUTCDate(),
        }),
        label: "Last Month",
      };
    }
    case "last30Days": {
      return {
        startDate: formatCalendarPartsISO(addDays(today, -29)),
        endDate: formatCalendarPartsISO(today),
        label: "Last 30 Days",
      };
    }
    case "custom":
    case "today":
    default:
      return {
        startDate: formatCalendarPartsISO(today),
        endDate: formatCalendarPartsISO(today),
        label: "Today",
      };
  }
};

const formatCalendarDateForReport = (value: string): string => {
  const [year, month, day] = value.split("-").map(Number);
  return format(new Date(year, month - 1, day), "MMM dd, yyyy");
};

interface ShiftDetailResponse {
  success: boolean;
  shift: DetailedShift;
  error?: string;
}

export const InfertilityCashTrackerWidget: React.FC = () => {
  const { user } = useAuth();
  const { showNotification, hideNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDetailedReport, setIsLoadingDetailedReport] =
    useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customDateRange, setCustomDateRange] =
    useState<CustomDateRange | null>(null);
  const [tempRange, setTempRange] = useState<DateRangeState>({});
  const [staffId, setStaffId] = useState<number | null>(null);
  const [isDateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [isCustomRangePickerOpen, setCustomRangePickerOpen] = useState(false);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const canSelectStaff = Boolean(user?.role && isAdminRole(user.role));

  const selectedRange = useMemo(
    () => getPresetRange(datePreset, customDateRange),
    [customDateRange, datePreset],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useInfertilityCashTrackingShifts(
      {
        staffId,
        startDate: selectedRange.startDate,
        endDate: selectedRange.endDate,
        status: "All",
      },
      { enabled: isOpen },
    );

  const summary = data?.summary ?? {
    totalCollected: 0,
    totalRefunded: 0,
    activeShiftsCount: 0,
  };

  const netCash = summary.totalCollected - summary.totalRefunded;
  const staffOptions = data?.filterOptions.staff ?? [];
  const transactionCount =
    data?.shifts.reduce(
      (total, shift) =>
        total + (shift.paymentsCount || 0) + (shift.cashMovementsCount || 0),
      0,
    ) ?? 0;

  const shifts: ShiftSummary[] =
    data?.shifts.map((shift) => ({
      shiftId: shift.id,
      startTime: shift.startTime,
      endTime: shift.endTime ?? undefined,
      isActive: shift.isActive,
      totalCollected: shift.totalCollected,
      totalRefunded: shift.totalRefunded,
      transactionCount:
        (shift.paymentsCount || 0) + (shift.cashMovementsCount || 0),
      departmentBreakdown: [],
    })) ?? [];

  const staffNameForReport = useMemo(() => {
    if (canSelectStaff) {
      if (!staffId) return "All Staff";

      return (
        staffOptions.find((staff) => staff.id === staffId)?.fullName ||
        "Selected Staff"
      );
    }

    return data?.filterOptions.staff[0]?.fullName || user?.fullName || "Staff";
  }, [canSelectStaff, data?.filterOptions.staff, staffId, staffOptions, user]);

  const reportDepartmentBreakdown = useMemo(
    () => [
      {
        departmentId: 0,
        departmentName: "HSI Center",
        totalCollected: summary.totalCollected,
        transactionCount,
      },
    ],
    [summary.totalCollected, transactionCount],
  );

  const reportShifts = useMemo(
    () =>
      shifts.map((shift) => ({
        ...shift,
        departmentBreakdown: [
          {
            departmentId: 0,
            departmentName: "HSI Center",
            totalCollected: shift.totalCollected,
            transactionCount: shift.transactionCount,
          },
        ],
      })),
    [shifts],
  );

  const handleGenerateSummaryReport = useCallback(async () => {
    if (!data) return;

    const loadingId = showNotification("Generating summary report", "loading");

    try {
      await generateSessionCashReport({
        reportTitle: "HSI CENTER CASH COLLECTION REPORT",
        branding: HSI_CASH_REPORT_BRANDING,
        staffName: staffNameForReport,
        generatedAt: formatBDT(new Date(), "MMM dd, yyyy hh:mm a"),
        periodLabel: selectedRange.label,
        startDate: formatCalendarDateForReport(selectedRange.startDate),
        endDate: formatCalendarDateForReport(selectedRange.endDate),
        departmentFilter: "HSI Center",
        totalCollected: summary.totalCollected,
        totalRefunded: summary.totalRefunded,
        netCash,
        transactionCount,
        departmentBreakdown: reportDepartmentBreakdown,
        shifts: reportShifts,
      });

      hideNotification(loadingId);
      showNotification("Summary report generated successfully", "success");
    } catch (error) {
      console.error("Error generating HSI cash summary report:", error);
      hideNotification(loadingId);
      showNotification("Failed to generate summary report", "error");
    }
  }, [
    data,
    hideNotification,
    netCash,
    reportDepartmentBreakdown,
    reportShifts,
    selectedRange.endDate,
    selectedRange.label,
    selectedRange.startDate,
    showNotification,
    staffNameForReport,
    summary.totalCollected,
    summary.totalRefunded,
    transactionCount,
  ]);

  const handleGenerateDetailedReport = useCallback(async () => {
    if (!data) return;

    setIsLoadingDetailedReport(true);
    const loadingId = showNotification("Generating detailed report", "loading");

    try {
      const shiftDetails = await Promise.all(
        data.shifts.map(async (shift) => {
          const response = await api.get<ShiftDetailResponse>(
            `/infertility/cash-tracking/${shift.id}`,
          );

          if (!response.data.success) {
            throw new Error(
              response.data.error || "Failed to fetch shift details",
            );
          }

          return response.data.shift;
        }),
      );

      const detailedShifts: DetailedCashReportData["shifts"] =
        shiftDetails.map((shift) => {
          const payments = shift.payments.flatMap((payment) => {
            if (payment.paymentAllocations.length === 0) {
              return [
                {
                  paymentId: payment.id,
                  registrationId: payment.receiptNumber,
                  paymentDate: payment.paymentDate,
                  amount: Number(payment.amount),
                  paymentMethod: "Cash",
                  patientId: payment.patientAccount.patient.id,
                  patientName: payment.patientAccount.patient.fullName,
                  patientPhone:
                    payment.patientAccount.patient.phoneNumber || undefined,
                  serviceName: "Infertility payment",
                  serviceType: "HSI Center",
                  departmentName: "HSI Center",
                },
              ];
            }

            return payment.paymentAllocations.map((allocation) => ({
              paymentId: payment.id,
              registrationId: payment.receiptNumber,
              paymentDate: payment.paymentDate,
              amount: Number(allocation.allocatedAmount),
              paymentMethod: "Cash",
              patientId: payment.patientAccount.patient.id,
              patientName: payment.patientAccount.patient.fullName,
              patientPhone:
                payment.patientAccount.patient.phoneNumber || undefined,
              serviceName: allocation.serviceCharge.serviceName,
              serviceType: allocation.serviceCharge.serviceType,
              departmentName: "HSI Center",
            }));
          });

          const refunds = shift.cashMovements
            .filter((movement) => movement.movementType === "REFUND")
            .map((movement) => ({
              paymentId: movement.payment?.id,
              registrationId: movement.payment?.receiptNumber || "Refund",
              refundDate: movement.timestamp,
              amount: Number(movement.amount),
              patientId: movement.payment?.patientAccount.patient.id,
              patientName:
                movement.payment?.patientAccount.patient.fullName || "Unknown",
              patientPhone:
                movement.payment?.patientAccount.patient.phoneNumber ||
                undefined,
              serviceName: movement.description || "Refund",
              serviceType: "HSI Center",
              departmentName: "HSI Center",
              description: movement.description || undefined,
            }));

          return {
            shiftId: shift.id,
            startTime: shift.startTime,
            endTime: shift.endTime ?? undefined,
            isActive: shift.isActive,
            totalCollected: Number(shift.totalCollected),
            totalRefunded: Number(shift.totalRefunded),
            transactionCount: payments.length + refunds.length,
            departmentBreakdown: [
              {
                departmentId: 0,
                departmentName: "HSI Center",
                totalCollected: Number(shift.totalCollected),
                transactionCount: payments.length,
              },
            ],
            shiftDate: formatBDT(shift.startTime, "MMM dd, yyyy"),
            payments,
            refunds,
          };
        });

      await generateDetailedCashReport({
        reportTitle: "DETAILED HSI CENTER CASH COLLECTION REPORT",
        branding: HSI_CASH_REPORT_BRANDING,
        staffName: staffNameForReport,
        generatedAt: formatBDT(new Date(), "MMM dd, yyyy hh:mm a"),
        periodLabel: selectedRange.label,
        startDate: formatCalendarDateForReport(selectedRange.startDate),
        endDate: formatCalendarDateForReport(selectedRange.endDate),
        departmentFilter: "HSI Center",
        totalCollected: summary.totalCollected,
        totalRefunded: summary.totalRefunded,
        netCash,
        transactionCount,
        departmentBreakdown: reportDepartmentBreakdown,
        shifts: detailedShifts,
      });

      hideNotification(loadingId);
      showNotification("Detailed report generated successfully", "success");
    } catch (error) {
      console.error("Error generating HSI cash detailed report:", error);
      hideNotification(loadingId);
      showNotification("Failed to generate detailed report", "error");
    } finally {
      setIsLoadingDetailedReport(false);
    }
  }, [
    data,
    hideNotification,
    netCash,
    reportDepartmentBreakdown,
    selectedRange.endDate,
    selectedRange.label,
    selectedRange.startDate,
    showNotification,
    staffNameForReport,
    summary.totalCollected,
    summary.totalRefunded,
    transactionCount,
  ]);

  const handleDateClick = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    if (!tempRange.from) {
      setTempRange({ from: normalizedDate, to: undefined });
      return;
    }

    if (!tempRange.to) {
      if (normalizedDate < tempRange.from) {
        setTempRange({ from: normalizedDate, to: tempRange.from });
        return;
      }

      setTempRange({ from: tempRange.from, to: normalizedDate });
      return;
    }

    setTempRange({ from: normalizedDate, to: undefined });
  };

  const handleDatePresetSelect = (preset: DatePreset) => {
    if (preset === "custom") {
      setDateDropdownOpen(false);
      setTempRange({
        from: customDateRange?.from,
        to: customDateRange?.to,
      });
      setCustomRangePickerOpen(true);
      return;
    }

    setDatePreset(preset);
    setCustomDateRange(null);
    setDateDropdownOpen(false);
  };

  const handleConfirmRange = () => {
    if (!tempRange.from || !tempRange.to) return;

    setCustomDateRange({ from: tempRange.from, to: tempRange.to });
    setDatePreset("custom");
    setCustomRangePickerOpen(false);
  };

  const handleClearRange = () => {
    setTempRange({});
    setCustomDateRange(null);
    setDatePreset("today");
    setCustomRangePickerOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setDateDropdownOpen(false);
    setCustomRangePickerOpen(false);
    setIsOpen(false);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 hover:shadow-md active:scale-95"
      >
        <Wallet className="h-4 w-4" />
        Cash Tracker
      </button>

      <ModalShell
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95%] sm:max-w-[620px] h-[88%] rounded-3xl overflow-hidden flex flex-col"
      >
        <ModalHeader
          icon={Wallet}
          iconColor="green"
          title="HSI Center Cash Tracker"
          subtitle="Infertility cash collections, refunds, and shifts."
          onClose={handleClose}
          isDisabled={false}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          <div className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm">
            <CashTrackerHeader
              periodLabel={selectedRange.label}
              shiftsCount={data?.shifts.length || 0}
              isFetching={isFetching}
              hasData={Boolean(data)}
              isLoadingDetailedReport={isLoadingDetailedReport}
              onGenerateReport={handleGenerateSummaryReport}
              onGenerateDetailedReport={handleGenerateDetailedReport}
              onRefresh={handleRefresh}
            />

            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {canSelectStaff ? (
                <StaffFilter
                  staff={staffOptions}
                  currentStaffId={staffId}
                  onStaffChange={setStaffId}
                  disabled={isFetching}
                  placeholder="All Staff"
                  className="w-full"
                  dropdownClassName="w-full sm:min-w-[260px]"
                  showAllOption={true}
                />
              ) : null}

              <button
                ref={dateButtonRef}
                type="button"
                onClick={() => setDateDropdownOpen((open) => !open)}
                disabled={isFetching}
                className={cn(
                  "flex h-[42px] items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
                  !canSelectStaff && "sm:col-span-2",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{selectedRange.label}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              </button>
            </div>

            <DropdownPortal
              isOpen={isDateDropdownOpen}
              onClose={() => setDateDropdownOpen(false)}
              buttonRef={dateButtonRef}
              className="w-44"
            >
              <div className="py-1">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleDatePresetSelect(preset.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs font-medium transition hover:bg-gray-50",
                      datePreset === preset.value
                        ? "bg-fnh-navy/5 text-fnh-navy"
                        : "text-gray-700",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </DropdownPortal>

            <CashTrackerSummary
              netCash={netCash}
              totalCollected={summary.totalCollected}
              totalRefunded={summary.totalRefunded}
              transactionCount={transactionCount}
            />

            {isLoading && !data ? (
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : null}

            {isError ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                Failed to load HSI cash tracker data.
              </div>
            ) : null}

            {!isLoading && !isError && shifts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                <p className="text-sm font-bold text-slate-700">
                  No cash shifts found.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Change the staff or date filter to view other records.
                </p>
              </div>
            ) : (
              <CashTrackerShifts shifts={shifts} />
            )}

            {summary.activeShiftsCount > 0 ? (
              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                {summary.activeShiftsCount} active HSI cash shift
                {summary.activeShiftsCount === 1 ? "" : "s"}.
              </div>
            ) : null}
          </div>
        </div>

        {isCustomRangePickerOpen ? (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setCustomRangePickerOpen(false)}
            />

            <div className="relative z-10 w-[95vw] max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-4">
                <h3 className="text-sm font-bold text-fnh-navy">
                  Select Custom Date Range
                </h3>
                <button
                  type="button"
                  onClick={() => setCustomRangePickerOpen(false)}
                  className="rounded-lg p-1.5 transition hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                <CalendarWithMonthYearPicker
                  value={tempRange.from}
                  onSelect={handleDateClick}
                  disabled={false}
                  disableFutureDates={true}
                  selectedRange={tempRange}
                  className="border-0 shadow-none"
                />

                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Selected Range
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        From
                      </span>
                      <span className="font-bold text-fnh-navy">
                        {tempRange.from
                          ? format(tempRange.from, "MMM dd, yyyy")
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        To
                      </span>
                      <span className="font-bold text-fnh-navy">
                        {tempRange.to
                          ? format(tempRange.to, "MMM dd, yyyy")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClearRange}
                      className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRange}
                      disabled={!tempRange.from || !tempRange.to}
                      className="flex-1 rounded-lg bg-fnh-navy px-3 py-2 text-xs font-bold text-white transition hover:bg-fnh-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </>
  );
};

export default InfertilityCashTrackerWidget;
