"use client";

import React from "react";
import { FileText, RefreshCw } from "lucide-react";

interface CashTrackerHeaderProps {
  periodLabel: string;
  shiftsCount: number;
  isFetching: boolean;
  hasData: boolean;
  onGenerateReport: () => void;
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
  onGenerateReport,
  onRefresh,
}) => {
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
        {/* Generate Report */}
        <button
          onClick={onGenerateReport}
          disabled={!hasData || isFetching}
          className="p-1.5 sm:p-2 rounded-lg bg-fnh-navy/5 hover:bg-fnh-navy/10 transition-colors text-fnh-navy cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate Report"
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

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
