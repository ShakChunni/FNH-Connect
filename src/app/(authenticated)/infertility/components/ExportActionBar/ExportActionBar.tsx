/**
 * Export Action Bar Component for Infertility Module
 * Provides report generation buttons for PDF and Excel exports
 */

"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { FileText, Table2, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "@/hooks/useNotification";
import { useFetchInfertilityReportData } from "../../hooks";
import { generateInfertilityReport } from "../../utils/generateReport";
import { generateInfertilitySummaryReport } from "../../utils/generateSummaryReport";
import { normalizePatientData } from "@/components/form-sections/utils/dataUtils";
import { useAuth } from "@/app/AuthContext";
import { useFilterValues } from "../../stores/filterStore";
import { buildBDTQueryDateRange } from "@/lib/timezone";

interface ExportActionBarProps {
  recordCount?: number;
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({
  recordCount = 0,
}) => {
  const { user } = useAuth();
  const { showNotification, hideNotification } = useNotification();
  const loadingNotificationId = useRef<number | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "detailed" | null>(
    null
  );
  const patientFilterValues = useFilterValues();

  const patientReportFilters = useMemo(
    () => ({
      search:
        patientFilterValues.search.length >= 2
          ? patientFilterValues.search
          : undefined,
      ...buildBDTQueryDateRange(
        patientFilterValues.startDate,
        patientFilterValues.endDate
      ),
    }),
    [patientFilterValues]
  );

  // Fetch all data when needed for report
  const { data: reportData, isLoading: isLoadingData } =
    useFetchInfertilityReportData({
      filters: patientReportFilters,
      enabled: shouldFetch,
    });

  // Handle PDF Summary Report
  const handleSummaryReport = useCallback(async () => {
    if (recordCount === 0) {
      showNotification("No records to export", "error");
      return;
    }

    loadingNotificationId.current = showNotification(
      "Fetching patient data for summary report",
      "loading",
    );
    setIsGeneratingSummary(true);
    setReportType("summary");
    setShouldFetch(true);
  }, [recordCount, showNotification]);

  // Handle PDF Detailed Report
  const handleDetailedReport = useCallback(async () => {
    if (recordCount === 0) {
      showNotification("No records to export", "error");
      return;
    }

    loadingNotificationId.current = showNotification(
      "Fetching patient data for detailed report",
      "loading",
    );
    setIsGeneratingPDF(true);
    setReportType("detailed");
    setShouldFetch(true);
  }, [recordCount, showNotification]);

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
          if (loadingNotificationId.current !== null) {
            hideNotification(loadingNotificationId.current);
            loadingNotificationId.current = null;
          }
          showNotification("Summary report generated successfully", "success");
        } catch (error) {
          if (loadingNotificationId.current !== null) {
            hideNotification(loadingNotificationId.current);
            loadingNotificationId.current = null;
          }
          showNotification("Failed to generate summary report", "error");
          console.error(error);
        } finally {
          setIsGeneratingSummary(false);
          setShouldFetch(false);
          setReportType(null);
        }
      } else if (reportType === "detailed") {
        try {
          // For detailed, generate multiple individual reports or a combined one
          if (normalizedData.length === 1) {
            generateInfertilityReport(
              normalizedData[0],
              user?.fullName || "Staff"
            );
          } else {
            // Generate batch detailed report
            generateInfertilitySummaryReport(
              normalizedData,
              user?.fullName || "Staff",
              true // detailed mode
            );
          }
          if (loadingNotificationId.current !== null) {
            hideNotification(loadingNotificationId.current);
            loadingNotificationId.current = null;
          }
          showNotification("Detailed report generated successfully", "success");
        } catch (error) {
          if (loadingNotificationId.current !== null) {
            hideNotification(loadingNotificationId.current);
            loadingNotificationId.current = null;
          }
          showNotification("Failed to generate detailed report", "error");
          console.error(error);
        } finally {
          setIsGeneratingPDF(false);
          setShouldFetch(false);
          setReportType(null);
        }
      }
    }
  }, [
    shouldFetch,
    reportData,
    isLoadingData,
    reportType,
    user?.fullName,
    hideNotification,
    showNotification,
  ]);

  // Don't show if no records
  if (recordCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Record count badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
              <Download className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                {recordCount} {recordCount === 1 ? "record" : "records"}
              </span>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* PDF Summary Button */}
            <button
              onClick={handleSummaryReport}
              disabled={isGeneratingSummary || isLoadingData}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isGeneratingSummary ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                Summary PDF
              </span>
            </button>

            {/* PDF Detailed Button */}
            <button
              onClick={handleDetailedReport}
              disabled={isGeneratingPDF || isLoadingData}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Table2 className="w-4 h-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                Detailed PDF
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportActionBar;
