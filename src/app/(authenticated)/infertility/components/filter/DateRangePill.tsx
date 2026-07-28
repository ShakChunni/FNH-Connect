"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, ChevronLeft, X } from "lucide-react";
import { format } from "date-fns";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import { useInfertilityFilterStore } from "../../stores/filterStore";

interface DateRangePillProps {
  disabled?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Calendar Month" },
  { value: "custom", label: "Custom Range" },
];

export const DateRangePill: React.FC<DateRangePillProps> = ({
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const dateRange = useInfertilityFilterStore((state) => state.dateRange);
  const startDate = useInfertilityFilterStore((state) => state.startDate);
  const endDate = useInfertilityFilterStore((state) => state.endDate);
  const setDateRange = useInfertilityFilterStore((state) => state.setDateRange);
  const setCustomDateRange = useInfertilityFilterStore(
    (state) => state.setCustomDateRange,
  );
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: startDate ?? undefined,
    to: endDate ?? undefined,
  });

  useEffect(() => {
    if (dateRange === "custom" && startDate && endDate) {
      setTempRange({ from: startDate, to: endDate });
    }
  }, [dateRange, endDate, startDate]);

  const handlePresetSelect = (option: string) => {
    if (option === "custom") {
      setTempRange({
        from: dateRange === "custom" ? startDate ?? undefined : undefined,
        to: dateRange === "custom" ? endDate ?? undefined : undefined,
      });
      setShowCalendar(true);
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
    setIsOpen(false);
  };

  const handleClear = () => {
    setDateRange("all");
    setTempRange({ from: undefined, to: undefined });
    setShowCalendar(false);
    setIsOpen(false);
  };

  const selectedLabel =
    DATE_RANGE_OPTIONS.find((option) => option.value === dateRange)?.label ??
    "Date Range";
  const displayText =
    dateRange === "custom" && startDate && endDate
      ? `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`
      : selectedLabel;
  const hasActiveFilter = dateRange !== "all";

  return (
    <>
      <div className="relative h-full w-full sm:w-auto">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          disabled={disabled}
          className={`flex h-full w-full items-center justify-center gap-2 rounded-full border bg-white px-4 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 ${
            hasActiveFilter
              ? "border-emerald-600 bg-emerald-50/50 pr-10 text-emerald-700"
              : "border-gray-200 text-gray-600 hover:border-emerald-600 hover:bg-gray-50 hover:text-emerald-600"
          }`}
          aria-label="Filter patient reports by date"
          aria-expanded={isOpen}
        >
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden max-w-48 truncate sm:inline">{displayText}</span>
          <span className="sm:hidden">Date</span>
          {!hasActiveFilter && (
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            aria-label="Clear patient date filter"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setShowCalendar(false);
        }}
        buttonRef={buttonRef}
        matchButtonWidth={false}
        className={showCalendar ? "w-[min(22rem,calc(100vw-1.5rem))]" : "min-w-[230px]"}
      >
        {showCalendar ? (
          <div className="max-h-[min(36rem,calc(100vh-2rem))] overflow-y-auto p-3">
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-emerald-700"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to presets
            </button>

            <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
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
                      ? format(tempRange.from, "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase text-gray-400">
                    To
                  </span>
                  <span className="font-bold text-slate-800">
                    {tempRange.to ? format(tempRange.to, "MMM d, yyyy") : "—"}
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
        ) : (
          <div className="max-h-[min(24rem,calc(100vh-2rem))] overflow-y-auto py-2">
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Patient report period
            </p>
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePresetSelect(option.value)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                  dateRange === option.value
                    ? "bg-emerald-950 font-medium text-white"
                    : "text-gray-700 hover:bg-slate-100"
                }`}
              >
                <span>{option.label}</span>
                {dateRange === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        )}
      </DropdownPortal>
    </>
  );
};

export default DateRangePill;
