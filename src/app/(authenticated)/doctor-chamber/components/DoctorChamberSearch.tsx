"use client";

import React, { useRef, useState } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Search,
  SlidersHorizontal,
  Stethoscope,
} from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface DoctorChamberSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  onGenerateSummary: () => void;
  onGenerateDetailed: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
}

interface ReportTriggerButtonProps {
  disabled: boolean;
  onGenerateSummary: () => void;
  onGenerateDetailed: () => void;
  onExportExcel: () => void;
}

function ReportTriggerButton({
  disabled,
  onGenerateSummary,
  onGenerateDetailed,
  onExportExcel,
}: ReportTriggerButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        className="relative flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
        aria-label="Generate chamber reports"
      >
        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Report</span>
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[220px]"
      >
        <div className="py-2">
          <div className="px-3 py-2 text-2xs font-bold uppercase tracking-wider text-slate-500">
            Generate Report
          </div>
          <button
            type="button"
            onClick={() => handleAction(onGenerateSummary)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
          >
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <span>
              <span className="block font-medium">Summary Report</span>
              <span className="block text-xs text-slate-500">Overview stats & counts</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleAction(onGenerateDetailed)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>
              <span className="block font-medium">Detailed Report</span>
              <span className="block text-xs text-slate-500">Full patient details</span>
            </span>
          </button>
          <div className="my-2 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => handleAction(onExportExcel)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>
              <span className="block font-medium">Export to Excel</span>
              <span className="block text-xs text-slate-500">Spreadsheet format</span>
            </span>
          </button>
        </div>
      </DropdownPortal>
    </>
  );
}

export default function DoctorChamberSearch({
  search,
  onSearchChange,
  onOpenFilters,
  activeFilterCount,
  onGenerateSummary,
  onGenerateDetailed,
  onExportExcel,
  disabled = false,
}: DoctorChamberSearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const filterButton = (
    <button
      type="button"
      onClick={onOpenFilters}
      disabled={disabled}
      className="relative flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
      aria-label="Open chamber filters"
    >
      <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-fnh-blue px-1.5 text-xs font-bold text-white shadow-sm">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-4xl" style={{ pointerEvents: disabled ? "none" : "auto" }}>
      <div className="flex flex-col gap-3 sm:hidden">
        <div
          className={`flex h-11 w-full items-center rounded-full border bg-white transition-colors duration-200 ${
            isFocused
              ? "border-fnh-blue ring-1 ring-fnh-blue/20"
              : "border-slate-200 shadow-sm hover:border-slate-300"
          }`}
        >
          <div className="relative flex h-full min-w-0 flex-1 items-center">
            <Search
              className={`pointer-events-none absolute left-3 h-4 w-4 transition-colors duration-200 ${
                isFocused ? "text-fnh-blue" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search patient, phone..."
              className="h-full w-full rounded-full border-0 bg-transparent pl-10 pr-4 text-xs text-slate-700 outline-none focus:ring-0 placeholder:text-xs placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex w-full gap-2">
          <div className="h-11 flex-1">
            <ReportTriggerButton
              disabled={disabled}
              onGenerateSummary={onGenerateSummary}
              onGenerateDetailed={onGenerateDetailed}
              onExportExcel={onExportExcel}
            />
          </div>
          <div className="h-11 flex-1">{filterButton}</div>
        </div>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <div
          className={`flex h-14 min-w-0 flex-1 items-center rounded-full border bg-white transition-colors duration-200 ${
            isFocused
              ? "border-fnh-blue ring-1 ring-fnh-blue/20"
              : "border-slate-200 shadow-sm hover:border-slate-300"
          }`}
        >
          <div className="flex h-full shrink-0 items-center gap-2 rounded-l-full border-r border-fnh-navy-light/30 bg-fnh-navy-dark px-5 text-sm font-medium text-white">
            <Stethoscope className="h-4 w-4" />
            <span className="whitespace-nowrap">Private Chamber</span>
          </div>
          <div className="relative flex h-full min-w-0 flex-1 items-center">
            <Search
              className={`pointer-events-none absolute left-4 h-5 w-5 transition-colors duration-200 ${
                isFocused ? "text-fnh-blue" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search patient, phone, email, or visit number..."
              className="h-full w-full rounded-r-full border-0 bg-transparent pl-12 pr-4 text-base text-slate-700 outline-none focus:ring-0 placeholder:text-sm placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex h-14 shrink-0 items-center">
          <ReportTriggerButton
            disabled={disabled}
            onGenerateSummary={onGenerateSummary}
            onGenerateDetailed={onGenerateDetailed}
            onExportExcel={onExportExcel}
          />
        </div>
        <div className="flex h-14 shrink-0 items-center">{filterButton}</div>
      </div>
    </div>
  );
}
