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
}

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
      // If same date, do nothing
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
              "w-full justify-between text-left h-auto px-4 py-2.5 bg-white border border-gray-100 hover:border-fnh-blue focus:border-fnh-blue focus:ring-4 focus:ring-fnh-blue/5 cursor-pointer text-xs font-bold transition-all duration-200 rounded-xl shadow-sm text-gray-700 hover:text-gray-700",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3 w-3 shrink-0 text-gray-500" />
              <span
                className={cn(
                  "text-xs",
                  !range.from ? "text-gray-500" : "text-gray-700",
                )}
              >
                {formatDateRange()}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-auto p-0", popoverClassName)}
          align="start"
          sideOffset={8}
        >
          <div className="p-4 space-y-4">
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
