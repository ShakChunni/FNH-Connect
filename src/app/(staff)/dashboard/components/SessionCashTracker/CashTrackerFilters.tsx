"use client";

import React, { useRef } from "react";
import { Building2, Calendar, ChevronDown } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import type { DatePreset, Department } from "./types";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "lastWeek", label: "Last Week" },
  { value: "lastMonth", label: "Last Month" },
];

interface CashTrackerFiltersProps {
  datePreset: DatePreset;
  departmentId: number | "all";
  departments: Department[];
  isDeptDropdownOpen: boolean;
  isDateDropdownOpen: boolean;
  isFetching: boolean;
  onDepartmentSelect: (deptId: number | "all") => void;
  onDatePresetSelect: (preset: DatePreset) => void;
  onDeptDropdownToggle: () => void;
  onDateDropdownToggle: () => void;
  onDeptDropdownClose: () => void;
  onDateDropdownClose: () => void;
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
  isFetching,
  onDepartmentSelect,
  onDatePresetSelect,
  onDeptDropdownToggle,
  onDateDropdownToggle,
  onDeptDropdownClose,
  onDateDropdownClose,
}) => {
  const deptButtonRef = useRef<HTMLButtonElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Get labels
  const selectedDeptLabel =
    departmentId === "all"
      ? "All Depts"
      : departments.find((d) => d.id === departmentId)?.name || "All";

  const selectedDateLabel =
    DATE_PRESETS.find((p) => p.value === datePreset)?.label || "Today";

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
            <span className="truncate">{selectedDateLabel}</span>
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
              onClick={() => onDatePresetSelect(preset.value)}
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
    </>
  );
};

export default CashTrackerFilters;
