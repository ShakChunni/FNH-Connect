"use client";

import React, { useRef, useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { format } from "date-fns";
import { useFilterStore } from "../../../stores/filterStore";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export const DateRangeFilter: React.FC = () => {
  const { filters, setDateRange, setCustomDateRange } = useFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

  // State for custom date range selection
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.startDate || undefined,
    to: filters.endDate || undefined,
  });

  const handleSelect = (option: string) => {
    setDateRange(option as any);
    setIsOpen(false);

    // Open calendar picker automatically for custom range
    if (option === "custom") {
      setTempRange({ from: undefined, to: undefined });
      // Small delay to let dropdown close first
      setTimeout(() => setIsCalendarOpen(true), 150);
    }
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
        const newRange = { from: tempRange.from, to: normalizedDate };
        setTempRange(newRange);
        // Auto-apply and close when both dates are selected
        setCustomDateRange(newRange.from, newRange.to);
        setTimeout(() => setIsCalendarOpen(false), 300);
      }
      return;
    }

    // If both dates exist, reset and start new range
    setTempRange({ from: normalizedDate, to: undefined });
  };

  const handleClear = () => {
    setTempRange({ from: undefined, to: undefined });
  };

  const selectedLabel =
    DATE_OPTIONS.find((opt) => opt.value === filters.dateRange)?.label ||
    "Select Range";

  // Display text for button - show actual dates if custom range is set
  const displayText =
    filters.dateRange === "custom" && filters.startDate && filters.endDate
      ? `${format(filters.startDate, "MMM dd")} - ${format(
          filters.endDate,
          "MMM dd, yyyy"
        )}`
      : selectedLabel;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Calendar className="w-4 h-4 text-fnh-blue" />
        <span>Date Range</span>
      </div>

      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between px-4 py-3 
            bg-white border rounded-xl text-sm transition-all duration-200 cursor-pointer
            ${
              isOpen
                ? "border-fnh-blue ring-4 ring-fnh-blue/5"
                : "border-gray-200 hover:border-gray-300"
            }
          `}
        >
          <span
            className={
              filters.dateRange === "all"
                ? "text-gray-500"
                : "text-gray-900 font-medium"
            }
          >
            {displayText}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Preset Options Dropdown */}
        <DropdownPortal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          buttonRef={buttonRef}
          className="min-w-[220px]"
        >
          <div className="p-1.5 space-y-1">
            {DATE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer
                  ${
                    filters.dateRange === option.value
                      ? "bg-fnh-navy text-white font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <span>{option.label}</span>
                {filters.dateRange === option.value && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </DropdownPortal>
      </div>

      {/* Custom Range Button - Shows when custom is selected */}
      {filters.dateRange === "custom" && (
        <button
          ref={calendarButtonRef}
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className={`
            w-full flex items-center justify-between px-4 py-3 
            bg-fnh-porcelain border rounded-xl text-sm transition-all duration-200 cursor-pointer
            ${
              isCalendarOpen
                ? "border-fnh-blue ring-4 ring-fnh-blue/5"
                : "border-gray-200 hover:border-gray-300"
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-fnh-blue" />
            <span className="font-medium text-fnh-navy">
              {tempRange.from && tempRange.to
                ? `${format(tempRange.from, "MMM dd")} - ${format(
                    tempRange.to,
                    "MMM dd, yyyy"
                  )}`
                : tempRange.from
                ? `${format(tempRange.from, "MMM dd, yyyy")} - Select end date`
                : "Select date range"}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isCalendarOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Calendar Portal Dropdown */}
      <DropdownPortal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        buttonRef={calendarButtonRef}
        className="w-[320px]"
      >
        <div className="p-4 space-y-4">
          {/* Selected Range Display */}
          <div className="bg-fnh-porcelain/50 rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {tempRange.from && tempRange.to
                ? "Selected Range"
                : "Select Start & End Date"}
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
                  {tempRange.to ? format(tempRange.to, "MMM dd, yyyy") : "—"}
                </span>
              </div>
            </div>
            {(tempRange.from || tempRange.to) && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full mt-2 px-3 py-2 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Calendar */}
          <CalendarWithMonthYearPicker
            value={tempRange.from}
            onSelect={handleDateClick}
            selectedRange={tempRange}
            disableFutureDates={false}
          />
        </div>
      </DropdownPortal>
    </div>
  );
};

export default DateRangeFilter;
