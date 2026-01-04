"use client";

import React, { useRef, useState, useCallback } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useInfertilityFilterStore } from "../../stores/filterStore";
import { format } from "date-fns";

interface DateRangePillProps {
  disabled?: boolean;
}

// Date range preset options
const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_week", label: "Last 7 Days" },
  { value: "last_month", label: "Last 30 Days" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "this_year", label: "This Year" },
];

// Helper to calculate date range from option
const getDateRangeFromOption = (
  option: string
): { start: Date | null; end: Date | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "today":
      return { start: today, end: now };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case "last_week": {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return { start: lastWeek, end: now };
    }
    case "last_month": {
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      return { start: lastMonth, end: now };
    }
    case "last_3_months": {
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      return { start: last3Months, end: now };
    }
    case "this_year": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear, end: now };
    }
    default:
      return { start: null, end: null };
  }
};

/**
 * Date Range Pill for Infertility
 * Pill-shaped button with dropdown for date filtering
 */
export const DateRangePill: React.FC<DateRangePillProps> = ({
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("all");

  // Store actions
  const setStartDate = useInfertilityFilterStore((state) => state.setStartDate);
  const setEndDate = useInfertilityFilterStore((state) => state.setEndDate);
  const startDate = useInfertilityFilterStore((state) => state.startDate);
  const endDate = useInfertilityFilterStore((state) => state.endDate);

  // Get current label
  const getLabel = useCallback(() => {
    if (selectedOption === "all" && !startDate && !endDate) {
      return "All Time";
    }

    const option = DATE_RANGE_OPTIONS.find((o) => o.value === selectedOption);
    if (option && selectedOption !== "all") {
      return option.label;
    }

    if (startDate && endDate) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
    }

    return "Date Range";
  }, [selectedOption, startDate, endDate]);

  const handleOptionSelect = useCallback(
    (option: string) => {
      setSelectedOption(option);
      const { start, end } = getDateRangeFromOption(option);
      setStartDate(start);
      setEndDate(end);
      setIsOpen(false);
    },
    [setStartDate, setEndDate]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedOption("all");
      setStartDate(null);
      setEndDate(null);
    },
    [setStartDate, setEndDate]
  );

  const hasActiveFilter = selectedOption !== "all" || startDate || endDate;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative flex items-center justify-center gap-2 h-full w-full sm:w-auto px-4 sm:px-5 
          bg-white border rounded-full
          text-sm font-medium
          transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer shadow-sm hover:shadow-md
          ${
            hasActiveFilter
              ? "border-fnh-blue text-fnh-blue bg-blue-50/50"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-fnh-blue hover:text-fnh-blue"
          }`}
        aria-label="Filter by date"
      >
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{getLabel()}</span>
        <span className="sm:hidden">Date</span>

        {hasActiveFilter ? (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
            aria-label="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[200px]"
      >
        <div className="py-2">
          <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Filter by Date
          </div>

          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                selectedOption === option.value
                  ? "bg-fnh-navy text-white font-medium"
                  : "text-gray-700 hover:bg-slate-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </>
  );
};

export default DateRangePill;
