"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { CalendarWithMonthYearPicker } from "@/components/ui/calendar";
import { backdropVariants } from "@/components/ui/modal-animations";
import { DRAWER_TRANSITION } from "@/lib/motion";
import { format } from "date-fns";

export type DoctorChamberDateRange =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

interface DoctorChamberFiltersProps {
  isOpen: boolean;
  dateRange: DoctorChamberDateRange;
  startDate: Date | null;
  endDate: Date | null;
  onClose: () => void;
  onClear: () => void;
  onDateRangeChange: (range: DoctorChamberDateRange) => void;
  onCustomDateRange: (start: Date | null, end: Date | null) => void;
}

const dateOptions: Array<{ value: DoctorChamberDateRange; label: string }> = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Calendar Month" },
  { value: "custom", label: "Custom Range" },
];

interface DateRangeFilterProps {
  dateRange: DoctorChamberDateRange;
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (range: DoctorChamberDateRange) => void;
  onCustomDateRange: (start: Date | null, end: Date | null) => void;
}

function DateRangeFilter({
  dateRange,
  startDate,
  endDate,
  onDateRangeChange,
  onCustomDateRange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: startDate ?? undefined,
    to: endDate ?? undefined,
  });

  useEffect(() => {
    setTempRange({ from: startDate ?? undefined, to: endDate ?? undefined });
  }, [startDate, endDate]);

  const handleSelect = (option: DoctorChamberDateRange) => {
    if (option === "custom") {
      setShowCalendar(true);
      setTempRange({ from: startDate ?? undefined, to: endDate ?? undefined });
      setIsOpen(false);
      return;
    }

    onDateRangeChange(option);
    setShowCalendar(false);
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    if (!tempRange.from || tempRange.to) {
      setTempRange({ from: normalizedDate, to: undefined });
      return;
    }

    const start = normalizedDate < tempRange.from ? normalizedDate : tempRange.from;
    const end = normalizedDate < tempRange.from ? tempRange.from : normalizedDate;
    setTempRange({ from: start, to: end });
    onCustomDateRange(start, end);
    window.setTimeout(() => setShowCalendar(false), 300);
  };

  const selectedLabel =
    dateOptions.find((option) => option.value === dateRange)?.label ??
    "Select Range";
  const displayText =
    dateRange === "custom" && startDate && endDate
      ? `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`
      : selectedLabel;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Calendar className="h-4 w-4 text-fnh-grey" />
        Visit Date Range
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (showCalendar) setShowCalendar(false);
          else setIsOpen((current) => !current);
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors duration-200 hover:border-fnh-blue hover:bg-slate-50 focus:border-fnh-blue focus:outline-none focus:ring-2 focus:ring-fnh-blue/20"
      >
        <span className={dateRange === "all" ? "text-slate-500" : "font-medium text-slate-900"}>
          {displayText}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 ${isOpen || showCalendar ? "rotate-180" : ""}`} />
      </button>
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[220px]"
      >
        <div className="max-h-[280px] overflow-y-auto py-1">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                dateRange === option.value
                  ? "bg-fnh-navy font-medium text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center justify-between">
                {option.label}
                {dateRange === option.value && <Check className="h-4 w-4" />}
              </span>
            </button>
          ))}
        </div>
      </DropdownPortal>

      {showCalendar && (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-fnh-navy"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to presets
          </button>
          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-2xs font-black uppercase tracking-widest text-slate-500">
              {tempRange.from && tempRange.to ? "Selected Range" : "Select Start & End Date"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1"><span className="text-2xs font-bold uppercase tracking-wider text-slate-500">From</span><span className="font-bold text-fnh-navy tabular-nums">{tempRange.from ? format(tempRange.from, "MMM dd, yyyy") : "—"}</span></div>
              <div className="flex flex-col gap-1"><span className="text-2xs font-bold uppercase tracking-wider text-slate-500">To</span><span className="font-bold text-fnh-navy tabular-nums">{tempRange.to ? format(tempRange.to, "MMM dd, yyyy") : "—"}</span></div>
            </div>
            {(tempRange.from || tempRange.to) && (
              <button type="button" onClick={() => { setTempRange({ from: undefined, to: undefined }); onDateRangeChange("all"); }} className="mt-2 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50">Clear Selection</button>
            )}
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
}

export default function DoctorChamberFilters({
  isOpen,
  dateRange,
  startDate,
  endDate,
  onClose,
  onClear,
  onDateRangeChange,
  onCustomDateRange,
}: DoctorChamberFiltersProps) {
  const activeCount = dateRange === "all" ? 0 : 1;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onClose}
              className="fixed inset-0 z-[100000] bg-slate-950/50"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={DRAWER_TRANSITION}
              className="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-full flex-col overflow-hidden bg-white shadow-none sm:w-[400px] sm:rounded-l-[2rem] sm:shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="doctor-chamber-filter-title"
            >
              <div className="flex items-center justify-between bg-fnh-navy px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/15 p-2.5"><SlidersHorizontal className="h-5 w-5 text-white" /></div>
                  <div>
                    <h2 id="doctor-chamber-filter-title" className="text-lg font-bold tracking-tight text-white">Filters</h2>
                    {activeCount > 0 && <p className="text-xs font-medium text-fnh-yellow">{activeCount} filter active</p>}
                  </div>
                </div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white" aria-label="Close filters"><X className="h-5 w-5" /></button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <p className="text-2xs font-black uppercase tracking-widest text-indigo-700">Fixed doctor</p>
                  <p className="mt-1 text-sm font-bold text-indigo-950">Dr Sufia Khatun</p>
                  <p className="mt-1 text-xs text-indigo-800">This page only contains this private chamber&apos;s visits.</p>
                </div>
                <DateRangeFilter
                  dateRange={dateRange}
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={onDateRangeChange}
                  onCustomDateRange={onCustomDateRange}
                />
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={onClear} disabled={activeCount === 0} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-4 w-4" />Clear filters</button>
                  <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">Apply Filters</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
}
