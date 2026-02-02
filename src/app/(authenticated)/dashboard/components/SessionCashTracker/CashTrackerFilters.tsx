"use client";

import React, { useRef } from "react";
import { Building2, Calendar, ChevronDown, X } from "lucide-react";
import { format } from "date-fns";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import type { DatePreset, Department, CustomDateRange } from "./types";

interface DateRangeState {
  from?: Date;
  to?: Date;
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

interface CashTrackerFiltersProps {
  datePreset: DatePreset;
  departmentId: number | "all";
  departments: Department[];
  isDeptDropdownOpen: boolean;
  isDateDropdownOpen: boolean;
  isCustomRangePickerOpen: boolean;
  customDateRange: CustomDateRange | null;
  isFetching: boolean;
  onDepartmentSelect: (deptId: number | "all") => void;
  onDatePresetSelect: (preset: DatePreset) => void;
  onCustomDateRangeSelect: (range: CustomDateRange | null) => void;
  onDeptDropdownToggle: () => void;
  onDateDropdownToggle: () => void;
  onCustomRangePickerToggle: () => void;
  onDeptDropdownClose: () => void;
  onDateDropdownClose: () => void;
  onCustomRangePickerClose: () => void;
}

/**
 * Filter dropdowns for department and date range
 */
export const CashTrackerFilters: React.FC<CashTrackerFiltersProps> = ({
  datePreset,
  departmentId,
  departments,
  isDeptDropdownOpen,
  isDateDropdownOpen,
  isCustomRangePickerOpen,
  customDateRange,
  isFetching,
  onDepartmentSelect,
  onDatePresetSelect,
  onCustomDateRangeSelect,
  onDeptDropdownToggle,
  onDateDropdownToggle,
  onCustomRangePickerToggle,
  onDeptDropdownClose,
  onDateDropdownClose,
  onCustomRangePickerClose,
}) => {
  const deptButtonRef = useRef<HTMLButtonElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Custom range picker state
  const [tempRange, setTempRange] = React.useState<DateRangeState>({
    from: customDateRange?.from,
    to: customDateRange?.to,
  });

  // Reset temp range when custom range picker opens
  React.useEffect(() => {
    if (isCustomRangePickerOpen) {
      setTempRange({
        from: customDateRange?.from,
        to: customDateRange?.to,
      });
    }
  }, [isCustomRangePickerOpen, customDateRange]);

  // Get labels
  const selectedDeptLabel =
    departmentId === "all"
      ? "All Depts"
      : departments.find((d) => d.id === departmentId)?.name || "All";

  // Get date label - show custom range dates if custom is selected
  const getSelectedDateLabel = () => {
    if (
      datePreset === "custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      return `${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd")}`;
    }
    return DATE_PRESETS.find((p) => p.value === datePreset)?.label || "Today";
  };

  const handleDateClick = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // If no start date, set it
    if (!tempRange.from) {
      setTempRange({ from: normalizedDate, to: undefined });
      return;
    }

    // If start date exists but no end date, set end date
    if (!tempRange.to) {
      if (normalizedDate < tempRange.from) {
        // If clicked date is before start, swap them
        setTempRange({ from: normalizedDate, to: tempRange.from });
      } else if (normalizedDate > tempRange.from) {
        // Only set end date if it's after start date
        setTempRange({ from: tempRange.from, to: normalizedDate });
      }
      // If same date, allow single day selection
      else {
        setTempRange({ from: normalizedDate, to: normalizedDate });
      }
      return;
    }

    // If both dates exist, reset and start new range
    setTempRange({ from: normalizedDate, to: undefined });
  };

  const handleConfirmRange = () => {
    if (tempRange.from && tempRange.to) {
      onCustomDateRangeSelect({ from: tempRange.from, to: tempRange.to });
    }
  };

  const handleClearRange = () => {
    setTempRange({ from: undefined, to: undefined });
    onCustomDateRangeSelect(null);
  };

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === "custom") {
      onDateDropdownClose();
      onCustomRangePickerToggle();
    } else {
      onDatePresetSelect(preset);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-3 shrink-0">
        {/* Department Dropdown */}
        <button
          ref={deptButtonRef}
          onClick={onDeptDropdownToggle}
          disabled={isFetching}
          className="flex-1 flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-fnh-navy-dark transition-colors cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{selectedDeptLabel}</span>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
        </button>

        {/* Date Dropdown */}
        <button
          ref={dateButtonRef}
          onClick={onDateDropdownToggle}
          disabled={isFetching}
          className="flex-1 flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-fnh-navy-dark transition-colors cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{getSelectedDateLabel()}</span>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* Department Dropdown Portal */}
      <DropdownPortal
        isOpen={isDeptDropdownOpen}
        onClose={onDeptDropdownClose}
        buttonRef={deptButtonRef}
        className="w-48"
      >
        <div className="py-1 max-h-64 overflow-y-auto">
          <button
            onClick={() => onDepartmentSelect("all")}
            className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
              departmentId === "all"
                ? "text-fnh-navy bg-fnh-navy/5"
                : "text-gray-700"
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => onDepartmentSelect(dept.id)}
              className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                departmentId === dept.id
                  ? "text-fnh-navy bg-fnh-navy/5"
                  : "text-gray-700"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </DropdownPortal>

      {/* Date Preset Dropdown Portal */}
      <DropdownPortal
        isOpen={isDateDropdownOpen}
        onClose={onDateDropdownClose}
        buttonRef={dateButtonRef}
        className="w-40"
      >
        <div className="py-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                datePreset === preset.value
                  ? "text-fnh-navy bg-fnh-navy/5"
                  : "text-gray-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </DropdownPortal>

      {/* Custom Range Picker Modal */}
      {isCustomRangePickerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCustomRangePickerClose}
          />

          {/* Modal Content */}
          <div className="relative z-10 bg-white rounded-xl shadow-2xl max-w-sm w-[95vw] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-fnh-navy">
                Select Custom Date Range
              </h3>
              <button
                onClick={onCustomRangePickerClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Calendar */}
            <div className="p-4">
              <CalendarWithMonthYearPicker
                value={tempRange.from}
                onSelect={handleDateClick}
                disabled={false}
                disableFutureDates={true}
                selectedRange={tempRange}
                className="border-0 shadow-none"
              />

              {/* Selected Range Display */}
              {(tempRange.from || tempRange.to) && (
                <div className="space-y-3 border-t border-gray-100 pt-4 mt-4">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Selected Range
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">
                        From
                      </span>
                      <span className="font-bold text-fnh-navy">
                        {tempRange.from
                          ? format(tempRange.from, "MMM dd, yyyy")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">
                        To
                      </span>
                      <span className="font-bold text-fnh-navy">
                        {tempRange.to
                          ? format(tempRange.to, "MMM dd, yyyy")
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClearRange}
                      className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRange}
                      disabled={!tempRange.from || !tempRange.to}
                      className="flex-1 px-3 py-2 text-xs font-bold text-white bg-fnh-navy hover:bg-fnh-navy/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CashTrackerFilters;
