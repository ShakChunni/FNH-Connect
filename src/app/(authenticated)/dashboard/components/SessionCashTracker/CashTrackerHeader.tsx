"use client";

import React, { useRef, useState } from "react";
import { Printer, RefreshCw, FileText, List } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface CashTrackerHeaderProps {
  periodLabel: string;
  shiftsCount: number;
  isFetching: boolean;
  hasData: boolean;
  isLoadingDetailedReport?: boolean;
  onGenerateReport: () => void;
  onGenerateDetailedReport?: () => void;
  onRefresh: () => void;
}

/**
 * Header component with title and action buttons
 */
export const CashTrackerHeader: React.FC<CashTrackerHeaderProps> = ({
  periodLabel,
  shiftsCount,
  isFetching,
  hasData,
  isLoadingDetailedReport = false,
  onGenerateReport,
  onGenerateDetailedReport,
  onRefresh,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const printButtonRef = useRef<HTMLButtonElement>(null);

  const handleSummaryReport = () => {
    onGenerateReport();
    setIsDropdownOpen(false);
  };

  const handleDetailedReport = () => {
    onGenerateDetailedReport?.();
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex items-center justify-between mb-3 shrink-0">
      <div>
        <h2 className="text-sm lg:text-base font-semibold text-fnh-navy-dark">
          Cash Tracker
        </h2>
        <p className="text-[10px] lg:text-xs text-gray-500">
          {periodLabel}
          {shiftsCount > 1 && (
            <span className="ml-1 text-fnh-navy">• {shiftsCount} shifts</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {/* Print Report Dropdown */}
        <div className="relative">
          <button
            ref={printButtonRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={!hasData || isFetching || isLoadingDetailedReport}
            className="p-1.5 sm:p-2 rounded-lg bg-fnh-navy/5 hover:bg-fnh-navy/10 transition-colors text-fnh-navy cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print Report"
          >
            {isLoadingDetailedReport ? (
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          <DropdownPortal
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            buttonRef={printButtonRef}
            className="min-w-[140px] sm:min-w-[150px] py-1"
          >
            {/* Summary Report Option */}
            <button
              onClick={handleSummaryReport}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-fnh-navy/5 transition-colors group"
            >
              <FileText className="w-3.5 h-3.5 text-fnh-navy group-hover:text-fnh-navy-dark transition-colors" />
              <div>
                <span className="block font-medium text-fnh-navy-dark">
                  Summary
                </span>
                <span className="block text-[9px] text-gray-500/80">
                  Quick overview
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-2 my-0.5" />

            {/* Detailed Report Option */}
            {onGenerateDetailedReport && (
              <button
                onClick={handleDetailedReport}
                disabled={isLoadingDetailedReport}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-gray-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 group"
              >
                <List className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                <div>
                  <span className="block font-medium text-emerald-700">
                    Detailed
                  </span>
                  <span className="block text-[9px] text-gray-500/80">
                    With patient names
                  </span>
                </div>
              </button>
            )}
          </DropdownPortal>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isFetching}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-fnh-navy cursor-pointer disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isFetching ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default CashTrackerHeader;
