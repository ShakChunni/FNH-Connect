"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disableFutureDates?: boolean;
}

// Helper function to parse date strings safely without timezone offset
// Always treats dates as UTC dates (no timezone conversion)
const parseDateString = (
  value: Date | string | undefined
): Date | undefined => {
  if (!value) return undefined;

  if (value instanceof Date) {
    return new Date(value);
  }

  // Handle ISO date strings (YYYY-MM-DD or ISO 8601)
  if (typeof value === "string") {
    // If it's just a date string (YYYY-MM-DD), parse it as UTC date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      // Create as UTC: this represents the date in UTC timezone
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    // Otherwise parse as ISO string
    return new Date(value);
  }

  return undefined;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  className,
  disableFutureDates = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    parseDateString(value)
  );

  // Update date when value prop changes
  React.useEffect(() => {
    setDate(parseDateString(value));
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      onChange(undefined);
      setIsOpen(false);
      return;
    }

    // Normalize selected date to remove time component
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check min/max constraints
    if (minDate) {
      const normalizedMin = new Date(minDate);
      normalizedMin.setHours(0, 0, 0, 0);
      if (normalizedDate < normalizedMin) return;
    }

    if (maxDate) {
      const normalizedMax = new Date(maxDate);
      normalizedMax.setHours(0, 0, 0, 0);
      if (normalizedDate > normalizedMax) return;
    }

    setDate(normalizedDate);
    onChange(normalizedDate);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(true)}
            className={cn(
              "w-full justify-start text-left font-normal h-auto px-3 py-2 sm:px-4 sm:py-2.5",
              !date && "text-muted-foreground",
              "bg-white border border-gray-100 hover:border-fnh-blue focus:border-fnh-blue focus:ring-4 focus:ring-fnh-blue/5 cursor-pointer text-xs font-bold transition-all duration-200 rounded-xl shadow-sm",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3 flex-shrink-0" />
            <span className="text-xs">
              {date ? format(date, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <CalendarWithMonthYearPicker
            value={date}
            onSelect={handleDateSelect}
            disabled={disabled}
            disableFutureDates={disableFutureDates}
            minDate={minDate}
            maxDate={maxDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
