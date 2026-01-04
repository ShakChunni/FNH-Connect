"use client";

import React, { useRef, useState, useCallback } from "react";
import { FileText, BarChart3, FileSpreadsheet, Loader2 } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { toast } from "sonner";
import { useFetchInfertilityReportData } from "../../hooks";
import { generateInfertilityReport } from "../../utils/generateReport";
import { generateInfertilitySummaryReport } from "../../utils/generateSummaryReport";
import { normalizePatientData } from "@/components/form-sections/utils/dataUtils";
import { useAuth } from "@/app/AuthContext";

interface ReportTriggerButtonProps {
  disabled?: boolean;
  recordCount?: number;
}

/**
 * Report Trigger Button for Infertility
 * Pill-shaped button with dropdown for report generation options
 */
export const ReportTriggerButton: React.FC<ReportTriggerButtonProps> = ({
  disabled = false,
  recordCount = 0,
}) => {
  const { user } = useAuth();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "detailed" | null>(
    null
  );

  // Fetch all data when needed for report
  const { data: reportData, isLoading: isLoadingData } =
    useFetchInfertilityReportData({
      enabled: shouldFetch,
    });

  // Generate report when data is loaded
  React.useEffect(() => {
    if (shouldFetch && reportData && !isLoadingData) {
      const normalizedData = normalizePatientData(reportData);

      if (reportType === "summary") {
        try {
          generateInfertilitySummaryReport(
            normalizedData,
            user?.fullName || "Staff"
          );
          toast.success("Summary report generated successfully!");
        } catch (error) {
          toast.error("Failed to generate summary report");
          console.error(error);
        } finally {
          setIsGenerating(false);
          setShouldFetch(false);
          setReportType(null);
        }
      } else if (reportType === "detailed") {
        try {
          if (normalizedData.length === 1) {
            generateInfertilityReport(
              normalizedData[0],
              user?.fullName || "Staff"
            );
          } else {
            generateInfertilitySummaryReport(
              normalizedData,
              user?.fullName || "Staff",
              true
            );
          }
          toast.success("Detailed report generated successfully!");
        } catch (error) {
          toast.error("Failed to generate detailed report");
          console.error(error);
        } finally {
          setIsGenerating(false);
          setShouldFetch(false);
          setReportType(null);
        }
      }
    }
  }, [shouldFetch, reportData, isLoadingData, reportType, user?.fullName]);

  const handleSummaryReport = useCallback(() => {
    if (recordCount === 0) {
      toast.error("No records to export");
      return;
    }
    setIsGenerating(true);
    setReportType("summary");
    setShouldFetch(true);
    setIsOpen(false);
  }, [recordCount]);

  const handleDetailedReport = useCallback(() => {
    if (recordCount === 0) {
      toast.error("No records to export");
      return;
    }
    setIsGenerating(true);
    setReportType("detailed");
    setShouldFetch(true);
    setIsOpen(false);
  }, [recordCount]);

  const isLoading = isGenerating || isLoadingData;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="relative flex items-center justify-center gap-2 h-full w-full sm:w-auto px-4 sm:px-5 
          bg-white border border-gray-200 rounded-full
          text-gray-600 text-sm font-medium
          hover:bg-gray-50 hover:border-fnh-blue hover:text-fnh-blue
          transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer shadow-sm hover:shadow-md"
        aria-label="Generate reports"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <span>{isLoading ? "Generating..." : "Report"}</span>
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
            onClick={handleSummaryReport}
            disabled={recordCount === 0}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
              hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={handleDetailedReport}
            disabled={recordCount === 0}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
              hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <div className="font-medium">Detailed Report</div>
              <div className="text-xs text-gray-400">Full patient details</div>
            </div>
          </button>

          {recordCount > 0 && (
            <>
              <div className="my-2 border-t border-gray-100" />
              <div className="px-4 py-2 text-xs text-gray-400">
                {recordCount} {recordCount === 1 ? "record" : "records"}{" "}
                available
              </div>
            </>
          )}
        </div>
      </DropdownPortal>
    </>
  );
};

export default ReportTriggerButton;
