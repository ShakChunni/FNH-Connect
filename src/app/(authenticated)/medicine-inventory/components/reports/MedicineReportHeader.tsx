"use client";

import React, { useRef, useState } from "react";
import { Printer, FileText, List, Loader2 } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface MedicineReportHeaderProps {
  disabled?: boolean;
  isLoading?: boolean;
  onGenerateSummary: () => void;
  onGenerateDetailed: () => void;
}

/**
 * Print report dropdown for the medicine inventory page.
 *
 * Follows the same pattern as the dashboard cash tracker header:
 * a single print button that opens a portal dropdown with summary
 * and detailed report options.
 */
export const MedicineReportHeader: React.FC<MedicineReportHeaderProps> = ({
  disabled = false,
  isLoading = false,
  onGenerateSummary,
  onGenerateDetailed,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSummary = () => {
    onGenerateSummary();
    setIsOpen(false);
  };

  const handleDetailed = () => {
    onGenerateDetailed();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="flex items-center gap-1.5 px-3 py-2.5 bg-fnh-navy/5 hover:bg-fnh-navy/10 rounded-xl text-xs font-semibold text-fnh-navy transition-colors cursor-pointer border border-fnh-navy/10 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        title="Print Report"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Printer className="w-3.5 h-3.5" />
        )}
        <span>Print Report</span>
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[150px] py-1"
      >
        {/* Summary Report Option */}
        <button
          onClick={handleSummary}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-fnh-navy/5 transition-colors disabled:opacity-50 group"
        >
          <FileText className="w-3.5 h-3.5 text-fnh-navy group-hover:text-fnh-navy-dark transition-colors" />
          <div>
            <span className="block font-medium text-fnh-navy-dark">
              Summary
            </span>
            <span className="block text-[9px] text-gray-500/80">
              Grouped overview
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-2 my-0.5" />

        {/* Detailed Report Option */}
        <button
          onClick={handleDetailed}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 group"
        >
          <List className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
          <div>
            <span className="block font-medium text-emerald-700">
              Detailed
            </span>
            <span className="block text-[9px] text-gray-500/80">
              With patient details
            </span>
          </div>
        </button>
      </DropdownPortal>
    </div>
  );
};

export default MedicineReportHeader;
