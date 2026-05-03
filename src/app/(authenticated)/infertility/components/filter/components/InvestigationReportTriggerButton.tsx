"use client";

import React, { useRef, useState, useCallback } from "react";
import { FileText, BarChart3, FileSpreadsheet, Loader2, DollarSign } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { toast } from "sonner";
import { useFetchInfertilityTestReport } from "../../../hooks/useFetchInfertilityTestReport";
import { generateInfertilityInvestigationReport } from "../../../utils/generateInvestigationReport";
import { exportInvestigationsToCSV } from "../../../utils/exportToCSV";
import { useAuth } from "@/app/AuthContext";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";
import { buildBDTQueryDateRange } from "@/lib/timezone";

interface ReportTriggerButtonProps {
  disabled?: boolean;
  recordCount?: number;
}

/**
 * Report Trigger Button for Infertility Investigations
 * Handles Financial, Summary, Detailed reports and CSV export
 */
export const InvestigationReportTriggerButton: React.FC<ReportTriggerButtonProps> = ({
  disabled = false,
  recordCount = 0,
}) => {
  const { user } = useAuth();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const filters = useInfertilityTestFilterStore((state) => state.filters);
  const { mutateAsync: fetchReportData, isPending: isFetching } = useFetchInfertilityTestReport();

  const handleGenerateReport = async (type: "summary" | "detailed" | "financial" | "csv") => {
    if (recordCount === 0) {
      toast.error("No records to export");
      return;
    }

    setIsOpen(false);
    const loadingToast = toast.loading(`Preparing ${type} report...`);

    try {
      const dateRangeParams = buildBDTQueryDateRange(
        filters.startDate,
        filters.endDate
      );

      const data = await fetchReportData({
        search: filters.search,
        ...dateRangeParams,
        status: filters.status,
        testNames: filters.testNames,
        orderedById: filters.orderedById || undefined,
        doneById: filters.doneById || undefined,
      });

      if (!data || data.length === 0) {
        toast.error("No data found for the selected filters", { id: loadingToast });
        return;
      }

      if (type === "csv") {
        exportInvestigationsToCSV(data);
      } else {
        await generateInfertilityInvestigationReport(
          data, 
          type === "financial" ? "summary" : type, // financial uses summary layout but logic is same
          { 
            startDate: filters.startDate, 
            endDate: filters.endDate,
            dateRange: filters.dateRange 
          }
        );
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated!`, { id: loadingToast });
    } catch (error) {
      console.error("Report generation failed:", error);
      toast.error("Failed to generate report. Please try again.", { id: loadingToast });
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isFetching}
        className="relative flex items-center justify-center gap-2 h-full w-full sm:w-auto px-4 sm:px-5 
          bg-white border border-gray-200 rounded-full
          text-gray-600 text-sm font-medium
          hover:bg-gray-50 hover:border-emerald-600 hover:text-emerald-600
          transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer shadow-sm hover:shadow-md"
      >
        {isFetching ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <span>{isFetching ? "Generating..." : "Report"}</span>
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[240px]"
      >
        <div className="py-2">
          <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Investigation Reports
          </div>

          <button
            onClick={() => handleGenerateReport("summary")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-100 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <div className="text-left">
              <div className="font-medium">Summary Report</div>
              <div className="text-xs text-gray-400">Overview & test counts</div>
            </div>
          </button>

          <button
            onClick={() => handleGenerateReport("financial")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-100 transition-colors"
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <div className="font-medium">Financial Report</div>
              <div className="text-xs text-gray-400">Revenue & collection stats</div>
            </div>
          </button>

          <button
            onClick={() => handleGenerateReport("detailed")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-100 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Detailed Report</div>
              <div className="text-xs text-gray-400">Full investigation records</div>
            </div>
          </button>

          <div className="my-2 border-t border-gray-100" />

          <button
            onClick={() => handleGenerateReport("csv")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <div className="font-medium">Export to CSV</div>
              <div className="text-xs text-gray-400">Open in Excel/Sheets</div>
            </div>
          </button>
        </div>
      </DropdownPortal>
    </>
  );
};
