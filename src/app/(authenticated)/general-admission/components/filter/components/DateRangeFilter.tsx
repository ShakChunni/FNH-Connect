"use client";

import React, { useRef, useState, useEffect } from "react";
import { Calendar, ChevronDown, Check, ChevronLeft } from "lucide-react";
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
  const [showCalendar, setShowCalendar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // State for custom date range selection
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.startDate || undefined,
    to: filters.endDate || undefined,
  });

  // Sync tempRange with filters when custom dates change externally
  useEffect(() => {
    if (
      filters.dateRange === "custom" &&
      filters.startDate &&
      filters.endDate
    ) {
      setTempRange({
        from: filters.startDate,
        to: filters.endDate,
      });
    }
  }, [filters.startDate, filters.endDate, filters.dateRange]);

  const handleSelect = (option: string) => {
    if (option === "custom") {
      // Show calendar picker inline
      setShowCalendar(true);
      setTempRange({ from: undefined, to: undefined });
      setIsOpen(false);
    } else {
      setDateRange(option as any);
      setShowCalendar(false);
      setIsOpen(false);
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

    // If start date exists but no end date
    if (!tempRange.to) {
      let startDate = tempRange.from;
      let endDate = normalizedDate;

      // Swap if clicked date is before start
      if (normalizedDate < tempRange.from) {
        startDate = normalizedDate;
        endDate = tempRange.from;
      }

      // Set end date to end of day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Update temp range and apply filter
      setTempRange({ from: startDate, to: endDate });
      setCustomDateRange(startDate, endOfDay);

      // Close calendar after selection
      setTimeout(() => setShowCalendar(false), 300);
      return;
    }

    // If both dates exist, reset and start new range
    setTempRange({ from: normalizedDate, to: undefined });
  };

  const handleClear = () => {
    setTempRange({ from: undefined, to: undefined });
  };

  const handleBackToPresets = () => {
    setShowCalendar(false);
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
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Calendar className="w-4 h-4 text-fnh-grey" />
        Date Range
      </label>

      <button
        ref={buttonRef}
        onClick={() => {
          if (showCalendar) {
            setShowCalendar(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="w-full flex items-center justify-between gap-2 px-4 py-3
          bg-white border border-gray-200 rounded-xl
          text-sm text-gray-700
          hover:border-fnh-blue hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue
          transition-all duration-200 cursor-pointer"
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
            isOpen || showCalendar ? "rotate-180" : ""
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
        <div className="py-1 max-h-[280px] overflow-y-auto">
          {DATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                filters.dateRange === option.value
                  ? "bg-fnh-navy text-white font-medium"
                  : "text-gray-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {filters.dateRange === option.value && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            </button>
          ))}
        </div>
      </DropdownPortal>

      {/* Inline Calendar - Shows when custom range is selected */}
      {showCalendar && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Back button */}
          <button
            onClick={handleBackToPresets}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-fnh-navy transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" />
            Back to presets
          </button>

          {/* Selected Range Display */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
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

          {/* Calendar - Inline, not in portal */}
          <CalendarWithMonthYearPicker
            value={tempRange.from}
            onSelect={handleDateClick}
            selectedRange={tempRange}
            disableFutureDates={false}
          />
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
