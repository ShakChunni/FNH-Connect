"use client";

import React, { useRef, useState } from "react";
import { FileText, BarChart3, Receipt, FileSpreadsheet } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface ReportTriggerButtonProps {
  disabled?: boolean;
  onGenerateSummary: () => void;
  onGenerateDetailed: () => void;
  onGenerateFinancial: () => void;
  onExportCSV: () => void;
}

/**
 * Report Trigger Button
 * Pill-shaped button with dropdown for report generation options
 * Same size as FilterTriggerButton
 */
export const ReportTriggerButton: React.FC<ReportTriggerButtonProps> = ({
  disabled = false,
  onGenerateSummary,
  onGenerateDetailed,
  onGenerateFinancial,
  onExportCSV,
}) => {
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
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="relative flex items-center justify-center gap-2 h-full w-full sm:w-auto px-4 sm:px-5 
          bg-white border border-slate-200 rounded-full
          text-slate-600 text-sm font-medium
          hover:bg-slate-50 hover:border-fnh-blue hover:text-fnh-blue
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer shadow-sm"
        aria-label="Generate reports"
      >
        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Report</span>
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[220px]"
      >
        <div className="py-2">
          <div className="px-3 py-2 text-2xs font-bold text-slate-500 uppercase tracking-wider">
            Generate Report
          </div>

          <button
            onClick={() => handleAction(onGenerateSummary)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <div className="text-left">
              <div className="font-medium">Summary Report</div>
              <div className="text-xs text-slate-500">
                Overview stats & counts
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction(onGenerateDetailed)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <div className="text-left">
              <div className="font-medium">Detailed Report</div>
              <div className="text-xs text-slate-500">Full patient details</div>
            </div>
          </button>

          <button
            onClick={() => handleAction(onGenerateFinancial)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-amber-700" />
            <div className="text-left">
              <div className="font-medium">Financial Report</div>
              <div className="text-xs text-slate-500">Revenue & payments</div>
            </div>
          </button>

          <div className="my-2 border-t border-slate-100" />

          <button
            onClick={() => handleAction(onExportCSV)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <div className="text-left">
              <div className="font-medium">Export to CSV</div>
              <div className="text-xs text-slate-500">Spreadsheet format</div>
            </div>
          </button>
        </div>
      </DropdownPortal>
    </>
  );
};

export default ReportTriggerButton;
