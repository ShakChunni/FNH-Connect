"use client";

import React, { useRef, useState } from "react";
import { FileText, BarChart3, FileSpreadsheet } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface ReportTriggerButtonProps {
  disabled?: boolean;
  onGenerateSummary: () => void;
  onGenerateDetailed: () => void;
  onExportExcel: () => void;
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
  onExportExcel,
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
          bg-white border border-gray-200 rounded-full
          text-gray-600 text-sm font-medium
          hover:bg-gray-50 hover:border-fnh-blue hover:text-fnh-blue
          transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer shadow-sm hover:shadow-md"
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
          <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Generate Report
          </div>

          <button
            onClick={() => handleAction(onGenerateSummary)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <div className="text-left">
              <div className="font-medium">Summary Report</div>
              <div className="text-xs text-gray-400">
                Overview stats & counts
              </div>
            </div>
          </button>

          <button
            onClick={() => handleAction(onGenerateDetailed)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <div className="font-medium">Detailed Report</div>
              <div className="text-xs text-gray-400">Full patient details</div>
            </div>
          </button>

          <div className="my-2 border-t border-gray-100" />

          <button
            onClick={() => handleAction(onExportExcel)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
              hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Export to Excel</div>
              <div className="text-xs text-gray-400">Spreadsheet format</div>
            </div>
          </button>
        </div>
      </DropdownPortal>
    </>
  );
};

export default ReportTriggerButton;
