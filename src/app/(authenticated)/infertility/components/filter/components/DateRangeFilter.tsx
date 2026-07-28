"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Calendar Month" },
  { value: "custom", label: "Custom Range" },
];

export const DateRangeFilter: React.FC = () => {
  const filters = useInfertilityTestFilterStore((state) => state.filters);
  const setDateRange = useInfertilityTestFilterStore(
    (state) => state.setDateRange,
  );
  const setCustomDateRange = useInfertilityTestFilterStore(
    (state) => state.setCustomDateRange,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.startDate ?? undefined,
    to: filters.endDate ?? undefined,
  });

  useEffect(() => {
    if (filters.dateRange === "custom" && filters.startDate && filters.endDate) {
      setTempRange({
        from: filters.startDate,
        to: filters.endDate,
      });
    }
  }, [filters.dateRange, filters.endDate, filters.startDate]);

  const handleSelect = (option: string) => {
    if (option === "custom") {
      setShowCalendar(true);
      setTempRange({
        from:
          filters.dateRange === "custom"
            ? filters.startDate ?? undefined
            : undefined,
        to:
          filters.dateRange === "custom"
            ? filters.endDate ?? undefined
            : undefined,
      });
      setIsOpen(false);
      return;
    }

    setDateRange(option);
    setShowCalendar(false);
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (!tempRange.from || tempRange.to) {
      setTempRange({ from: selectedDate, to: undefined });
      return;
    }

    const from =
      selectedDate < tempRange.from ? selectedDate : tempRange.from;
    const to =
      selectedDate < tempRange.from ? tempRange.from : selectedDate;

    setTempRange({ from, to });
    setCustomDateRange(from, to);
    setShowCalendar(false);
  };

  const displayText =
    filters.dateRange === "custom" && filters.startDate && filters.endDate
      ? `${format(filters.startDate, "MMM dd")} – ${format(
          filters.endDate,
          "MMM dd, yyyy",
        )}`
      : DATE_OPTIONS.find((option) => option.value === filters.dateRange)
          ?.label ?? "Select Range";

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <Calendar className="h-3.5 w-3.5" />
        Report period
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (showCalendar) setShowCalendar(false);
          else setIsOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition hover:border-emerald-600 hover:bg-gray-50 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
      >
        <span
          className={
            filters.dateRange === "all"
              ? "text-gray-500"
              : "font-semibold text-emerald-700"
          }
        >
          {displayText}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen || showCalendar ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[230px]"
      >
        <div className="max-h-[280px] overflow-y-auto py-1">
          {DATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                filters.dateRange === option.value
                  ? "bg-emerald-950 font-medium text-white"
                  : "text-gray-700 hover:bg-slate-100"
              }`}
            >
              <span>{option.label}</span>
              {filters.dateRange === option.value && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </DropdownPortal>

      {showCalendar && (
        <div className="animate-in space-y-3 fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => {
              setShowCalendar(false);
              setTempRange({ from: undefined, to: undefined });
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-emerald-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to presets
          </button>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              {tempRange.from ? "Select end date" : "Select start date"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-[9px] font-bold uppercase text-gray-400">
                  From
                </span>
                <span className="font-bold text-slate-800">
                  {tempRange.from
                    ? format(tempRange.from, "MMM dd, yyyy")
                    : "—"}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold uppercase text-gray-400">
                  To
                </span>
                <span className="font-bold text-slate-800">
                  {tempRange.to
                    ? format(tempRange.to, "MMM dd, yyyy")
                    : "—"}
                </span>
              </div>
            </div>
          </div>

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
