"use client";

import { Button } from "@/components/ui/button";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  popoverClassName?: string;
  hideSelectedSummary?: boolean;
  disableFutureDates?: boolean;
  autoOpen?: boolean;
  showQuickPresets?: boolean;
}

interface QuickPreset {
  id: string;
  label: string;
  getRange: () => DateRange;
}

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return normalizeDate(next);
};

const addMonths = (date: Date, months: number): Date => {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonth + 1,
    0,
  ).getDate();
  const targetDay = Math.min(date.getDate(), lastDayOfTargetMonth);

  return normalizeDate(new Date(targetYear, targetMonth, targetDay));
};

const getLastMonthRange = (): DateRange => {
  const today = normalizeDate(new Date());
  const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );
  const lastDayOfLastMonth = addDays(firstDayOfThisMonth, -1);

  return {
    from: normalizeDate(firstDayOfLastMonth),
    to: normalizeDate(lastDayOfLastMonth),
  };
};

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "today",
    label: "Today",
    getRange: () => {
      const today = normalizeDate(new Date());
      return { from: today, to: today };
    },
  },
  {
    id: "last7Days",
    label: "Last 7 Days",
    getRange: () => {
      const today = normalizeDate(new Date());
      return { from: addDays(today, -6), to: today };
    },
  },
  {
    id: "last30Days",
    label: "Last 30 Days",
    getRange: () => {
      const today = normalizeDate(new Date());
      return { from: addDays(today, -29), to: today };
    },
  },
  {
    id: "lastMonth",
    label: "Last Month",
    getRange: getLastMonthRange,
  },
  {
    id: "last6Months",
    label: "Last 6 Months",
    getRange: () => {
      const today = normalizeDate(new Date());
      return { from: addMonths(today, -6), to: today };
    },
  },
];

const parseDateString = (
  value: Date | string | undefined,
): Date | undefined => {
  if (!value) return undefined;

  if (value instanceof Date) {
    return new Date(value);
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
    return new Date(value);
  }

  return undefined;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  minDate,
  maxDate,
  className,
  popoverClassName,
  hideSelectedSummary = false,
  disableFutureDates = false,
  autoOpen = false,
  showQuickPresets = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(autoOpen);

  const [range, setRange] = React.useState<DateRange>({
    from: value?.from ? parseDateString(value.from) : undefined,
    to: value?.to ? parseDateString(value.to) : undefined,
  });
  const [tempRange, setTempRange] = React.useState<DateRange>(range);

  React.useEffect(() => {
    setRange({
      from: value?.from ? parseDateString(value.from) : undefined,
      to: value?.to ? parseDateString(value.to) : undefined,
    });
  }, [value]);

  const handleDateClick = (date: Date) => {
    const normalizedDate = normalizeDate(date);

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
      } else if (normalizedDate >= tempRange.from) {
        // Allow a single-day range when the same date is selected twice.
        setTempRange({ from: tempRange.from, to: normalizedDate });
      }
      return;
    }

    // If both dates exist, reset and start new range
    setTempRange({ from: normalizedDate, to: undefined });
  };

  const handleConfirm = () => {
    if (tempRange.from && tempRange.to) {
      setRange(tempRange);
      onChange(tempRange);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setTempRange({ from: undefined, to: undefined });
    setRange({ from: undefined, to: undefined });
    onChange(undefined);
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: QuickPreset) => {
    const nextRange = preset.getRange();
    setTempRange(nextRange);
    setRange(nextRange);
    onChange(nextRange);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempRange(range);
    } else {
      // Reset tempRange when closing without confirming
      setTempRange(range);
    }
  };

  const formatDateRange = () => {
    if (!range.from) return placeholder;
    if (!range.to) return format(range.from, "MMM dd, yyyy");
    return `${format(range.from, "MMM dd")} - ${format(
      range.to,
      "MMM dd, yyyy",
    )}`;
  };

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(true)}
            className={cn(
              "w-full justify-between text-left h-[42px] px-4 py-0 bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue/30 cursor-pointer text-sm font-semibold transition-all duration-200 rounded-xl shadow-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed",
              className,
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <span
                className={cn(
                  !range.from ? "text-gray-500" : "text-gray-700",
                )}
              >
                {formatDateRange()}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-[min(24rem,calc(100vw-1rem))] p-0 overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-fnh-navy/10 data-[state=open]:duration-200 data-[state=closed]:duration-150",
            popoverClassName,
          )}
          align="start"
          sideOffset={8}
        >
          <div className="max-h-[min(82vh,42rem)] overflow-y-auto p-4 space-y-4">
            {showQuickPresets ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-fnh-navy-dark">
                      Quick Date Range
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Apply a common reporting period.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      disabled={disabled}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left text-[11px] font-bold text-gray-700 transition-colors hover:border-fnh-navy/20 hover:bg-fnh-navy/5 hover:text-fnh-navy disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <CalendarWithMonthYearPicker
              value={tempRange.from}
              onSelect={handleDateClick}
              disabled={disabled}
              disableFutureDates={disableFutureDates}
              minDate={minDate}
              maxDate={maxDate}
              selectedRange={tempRange}
            />

            {(tempRange.from || tempRange.to) && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
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
                    onClick={handleClear}
                    className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!tempRange.from || !tempRange.to}
                    className="flex-1 px-3 py-2 text-xs font-bold text-white bg-fnh-navy hover:bg-fnh-navy-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {!hideSelectedSummary && range.from && range.to && (
        <div className="text-xs text-jd-sandstone pt-1 font-medium">
          Selected range: {format(range.from, "MMM dd, yyyy")} to{" "}
          {format(range.to, "MMM dd, yyyy")}
        </div>
      )}
    </div>
  );
}
