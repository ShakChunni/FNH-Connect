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
        className="relative flex h-full w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-fnh-blue hover:bg-gray-50 hover:text-fnh-blue hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
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
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Generate Report
          </div>
          <button
            type="button"
            onClick={() => handleAction(onGenerateSummary)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-slate-100"
          >
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <span>
              <span className="block font-medium">Summary Report</span>
              <span className="block text-xs text-gray-400">Overview stats & counts</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleAction(onGenerateDetailed)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-slate-100"
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>
              <span className="block font-medium">Detailed Report</span>
              <span className="block text-xs text-gray-400">Full patient details</span>
            </span>
          </button>
          <div className="my-2 border-t border-gray-100" />
          <button
            type="button"
            onClick={() => handleAction(onExportExcel)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-slate-100"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span>
              <span className="block font-medium">Export to Excel</span>
              <span className="block text-xs text-gray-400">Spreadsheet format</span>
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
      className="relative flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-fnh-blue hover:bg-gray-50 hover:text-fnh-blue hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
      aria-label="Open chamber filters"
    >
      <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-fnh-blue px-1.5 text-xs font-bold text-white shadow-md">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-4xl" style={{ pointerEvents: disabled ? "none" : "auto" }}>
      <div className="flex flex-col gap-3 sm:hidden">
        <div
          className={`flex h-11 w-full items-center rounded-full border bg-white transition-all duration-300 ease-out ${
            isFocused
              ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
              : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
          }`}
        >
          <div className="relative flex h-full min-w-0 flex-1 items-center">
            <Search
              className={`pointer-events-none absolute left-3 h-4 w-4 transition-colors duration-200 ${
                isFocused ? "text-fnh-blue" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search patient, phone..."
              className="h-full w-full rounded-full border-0 bg-transparent pl-10 pr-4 text-xs text-gray-700 outline-none focus:ring-0 placeholder:text-xs placeholder:text-gray-400"
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
          className={`flex h-14 min-w-0 flex-1 items-center rounded-full border bg-white transition-all duration-300 ease-out ${
            isFocused
              ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
              : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
          }`}
        >
          <div className="flex h-full shrink-0 items-center gap-2 rounded-l-full border-r border-fnh-navy-light/30 bg-fnh-navy-dark px-5 text-sm font-medium text-white">
            <Stethoscope className="h-4 w-4" />
            <span className="whitespace-nowrap">Private Chamber</span>
          </div>
          <div className="relative flex h-full min-w-0 flex-1 items-center">
            <Search
              className={`pointer-events-none absolute left-4 h-5 w-5 transition-colors duration-200 ${
                isFocused ? "text-fnh-blue" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search patient, phone, email, or visit number..."
              className="h-full w-full rounded-r-full border-0 bg-transparent pl-12 pr-4 text-base text-gray-700 outline-none focus:ring-0 placeholder:text-sm placeholder:text-gray-400"
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
