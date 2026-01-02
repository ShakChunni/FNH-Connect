"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getYearRange = (currentYear: number, range: number = 12) => {
  const startYear = Math.floor(currentYear / range) * range;
  return Array.from({ length: range }, (_, i) => startYear + i);
};

type CalendarView = "days" | "months" | "years";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-2 sm:p-2 max-h-[500px] [--cell-size:--spacing(9)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        className
      )}
      captionLayout={captionLayout}
      formatters={formatters}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-2", defaultClassNames.month),
        month_caption: cn("hidden", defaultClassNames.month_caption),
        nav: cn("hidden", defaultClassNames.nav),
        button_previous: cn("hidden", defaultClassNames.button_previous),
        button_next: cn("hidden", defaultClassNames.button_next),
        table: "w-full border-collapse",
        weekdays: cn("flex gap-1.5", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-xs select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full gap-1.5 mt-1", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-xs select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-fnh-navy data-[selected-single=true]:text-white data-[range-middle=true]:bg-fnh-yellow/10 data-[range-middle=true]:text-fnh-navy data-[range-start=true]:bg-fnh-navy data-[range-start=true]:text-white data-[range-end=true]:bg-fnh-navy data-[range-end=true]:text-white group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground hover:bg-fnh-yellow hover:text-fnh-navy flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none text-[0.7rem] font-bold group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-[0.7rem] [&>span]:opacity-70 transition-colors duration-200",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

// Enhanced Calendar with Month/Year Selection Views
export function CalendarWithMonthYearPicker({
  value,
  onSelect,
  disabled,
  className,
  disableFutureDates = false,
  minDate,
  maxDate,
  selectedRange,
}: {
  value?: Date;
  onSelect: (date: Date) => void;
  disabled?: boolean;
  className?: string;
  disableFutureDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
  selectedRange?: { from?: Date; to?: Date };
}) {
  const [view, setView] = React.useState<CalendarView>("days");
  const [displayDate, setDisplayDate] = React.useState(value || new Date());

  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth();
  const yearRange = getYearRange(currentYear);

  // Calculate effective max date based on disableFutureDates flag
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMaxDate = disableFutureDates
    ? maxDate && maxDate < today
      ? maxDate
      : today
    : maxDate;

  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    // Normalize the date to remove time component for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    if (minDate) {
      const normalizedMin = new Date(minDate);
      normalizedMin.setHours(0, 0, 0, 0);
      if (normalizedDate < normalizedMin) return true;
    }

    if (effectiveMaxDate) {
      const normalizedMax = new Date(effectiveMaxDate);
      normalizedMax.setHours(0, 0, 0, 0);
      if (normalizedDate > normalizedMax) return true;
    }

    return false;
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(month);
    setDisplayDate(newDate);
    setView("days");
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(displayDate);
    newDate.setFullYear(year);
    setDisplayDate(newDate);
    setView("months");
  };

  const handlePrevYearRange = () => {
    const newDate = new Date(displayDate);
    newDate.setFullYear(currentYear - 12);
    setDisplayDate(newDate);
  };

  const handleNextYearRange = () => {
    const newDate = new Date(displayDate);
    newDate.setFullYear(currentYear + 12);
    setDisplayDate(newDate);
  };


  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {view === "months" && (
          <motion.div
            key="months-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            layout
            className={cn(
              "w-full p-4 sm:p-6 bg-white rounded-xl border border-gray-100 shadow-sm",
              className
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("years")}
                className="text-xs font-bold text-slate-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                {currentYear}
              </Button>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Select Month
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MONTHS.map((month, index) => (
                <Button
                  key={month}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    "text-xs font-bold px-4 py-3 rounded-xl transition-all duration-200",
                    currentMonth === index
                      ? "bg-yellow-300 text-slate-900 shadow-xs"
                      : "bg-gray-50 text-slate-900 hover:bg-gray-100"
                  )}
                >
                  {month.slice(0, 3)}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {view === "years" && (
          <motion.div
            key="years-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            layout
            className={cn(
              "w-full p-4 sm:p-6 bg-white rounded-xl border border-gray-100 shadow-sm",
              className
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevYearRange}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 text-slate-900" />
              </Button>
              <div className="text-xs font-bold text-slate-900">
                {yearRange[0]} - {yearRange[yearRange.length - 1]}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextYearRange}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 text-slate-900" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {yearRange.map((year) => (
                <Button
                  key={year}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleYearSelect(year)}
                  className={cn(
                    "text-xs font-bold px-4 py-3 rounded-xl transition-all duration-200",
                    currentYear === year
                      ? "bg-yellow-300 text-slate-900 shadow-xs"
                      : "bg-gray-50 text-slate-900 hover:bg-gray-100"
                  )}
                >
                  {year}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("months")}
                className="text-xs font-bold text-gray-400 hover:text-slate-900 transition-colors"
              >
                Back to Months
              </Button>
            </div>
          </motion.div>
        )}

        {view === "days" && (
          <motion.div
            key="days-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            layout
            className={cn(
              "w-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm",
              className
            )}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("months")}
                className="text-xs font-black text-slate-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200"
              >
                {MONTHS[currentMonth]} {currentYear}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(displayDate);
                    newDate.setMonth(currentMonth - 1);
                    setDisplayDate(newDate);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-slate-900" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(displayDate);
                    newDate.setMonth(currentMonth + 1);
                    setDisplayDate(newDate);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4 text-slate-900" />
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedRange?.from || value}
              onSelect={(date) => {
                if (date && !isDateDisabled(date)) {
                  onSelect(date);
                }
              }}
              month={displayDate}
              onMonthChange={setDisplayDate}
              disabled={(date) => {
                if (disabled) return true;
                return isDateDisabled(date);
              }}
              modifiers={
                selectedRange?.from && selectedRange?.to
                  ? {
                      range_start: selectedRange.from,
                      range_end: selectedRange.to,
                      range_middle: (date) => {
                        const from = selectedRange.from;
                        const to = selectedRange.to;
                        if (!from || !to) return false;
                        return date > from && date < to;
                      },
                    }
                  : selectedRange?.from
                  ? {
                      range_start: selectedRange.from,
                    }
                  : undefined
              }
              modifiersStyles={
                selectedRange?.from && selectedRange?.to
                  ? {
                      range_start: {
                        backgroundColor: "#fbbf24",
                        color: "#0f172a",
                        fontWeight: "700",
                      },
                      range_end: {
                        backgroundColor: "#fbbf24",
                        color: "#0f172a",
                        fontWeight: "700",
                      },
                      range_middle: {
                        backgroundColor: "rgba(251, 191, 36, 0.1)",
                        color: "#0f172a",
                      },
                    }
                  : selectedRange?.from
                  ? {
                      range_start: {
                        backgroundColor: "#fbbf24",
                        color: "#0f172a",
                        fontWeight: "700",
                      },
                    }
                  : undefined
              }
              className="border-0 shadow-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { Calendar, CalendarDayButton };
