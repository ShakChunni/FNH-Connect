"use client";

import React, { useMemo, useState, useCallback } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import {
  FloatingActionBar,
  FloatingAction,
} from "@/components/ui/FloatingActionBar";
import { usePathologyFilterStore } from "../../../stores";
import { PathologyPatientData } from "../../../types";
import { generatePathologyReport } from "../../../utils/generateReport";
import { exportPathologyToCSV } from "../../../utils/exportToCSV";
import { useFetchPathologyReportData } from "../../../hooks/useFetchPathologyReportData";
import { transformPathologyPatients } from "../../../utils/dataTransformers";
import { toast } from "sonner";

interface ExportActionBarProps {
  data: PathologyPatientData[];
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const filters = usePathologyFilterStore((state) => state.filters);
  const clearAllFilters = usePathologyFilterStore(
    (state) => state.clearAllFilters
  );
  const getActiveFilterCount = usePathologyFilterStore(
    (state) => state.getActiveFilterCount
  );
  const activeCount = getActiveFilterCount();

  // Hook for fetching all data for reports
  const { mutateAsync: fetchReportData } = useFetchPathologyReportData();

  // Show only when filters are active
  const shouldShow = activeCount > 0;

  // Helper to fetch all data for report generation
  const fetchAllDataForReport = useCallback(async (): Promise<
    PathologyPatientData[]
  > => {
    const reportFilters = {
      search: filters.search.length >= 2 ? filters.search : undefined,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      status: filters.status !== "All" ? filters.status : undefined,
      orderedById: filters.orderedById ?? undefined,
      doneById: filters.doneById ?? undefined,
      testNames: filters.testNames.length > 0 ? filters.testNames : undefined,
    };

    const rawData = await fetchReportData(reportFilters);
    return transformPathologyPatients(rawData);
  }, [fetchReportData, filters]);

  const handlePdfExport = useCallback(
    async (type: "summary" | "detailed") => {
      setIsGenerating(true);
      try {
        toast.loading("Fetching all data for report...", {
          id: "report-loading",
        });
        const allData = await fetchAllDataForReport();
        toast.dismiss("report-loading");

        if (allData.length === 0) {
          toast.error("No data found for the current filters");
          return;
        }

        toast.loading(`Generating ${type} report...`, {
          id: "report-generating",
        });
        await generatePathologyReport(allData, type, {
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
          orderedById: filters.orderedById,
          doneById: filters.doneById,
          testNames: filters.testNames,
        });
        toast.dismiss("report-generating");
        toast.success(
          `${
            type === "summary" ? "Summary" : "Detailed"
          } report generated with ${allData.length} records`
        );
      } catch (error) {
        toast.dismiss("report-loading");
        toast.dismiss("report-generating");
        toast.error("Failed to generate report");
        console.error("Report generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [fetchAllDataForReport, filters]
  );

  const handleCSVExport = useCallback(async () => {
    setIsGenerating(true);
    try {
      toast.loading("Fetching all data for export...", {
        id: "export-loading",
      });
      const allData = await fetchAllDataForReport();
      toast.dismiss("export-loading");

      if (allData.length === 0) {
        toast.error("No data found for the current filters");
        return;
      }

      exportPathologyToCSV(allData);
      toast.success(`Exported ${allData.length} records to CSV`);
    } catch (error) {
      toast.dismiss("export-loading");
      toast.error("Failed to export data");
      console.error("Export failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [fetchAllDataForReport]);

  const actions: FloatingAction[] = useMemo(
    () => [
      {
        label: isGenerating ? "Generating..." : "PDF Summary Report",
        icon: <FileText className="w-4 h-4" />,
        onClick: () => handlePdfExport("summary"),
        disabled: isGenerating,
      },
      {
        label: isGenerating ? "Generating..." : "PDF Detailed Report",
        icon: <Download className="w-4 h-4" />,
        onClick: () => handlePdfExport("detailed"),
        disabled: isGenerating,
      },
      {
        label: isGenerating ? "Exporting..." : "Export to CSV",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        onClick: handleCSVExport,
        disabled: isGenerating,
      },
    ],
    [handlePdfExport, handleCSVExport, isGenerating]
  );

  if (!shouldShow) return null;

  return (
    <FloatingActionBar
      selectedCount={activeCount}
      itemLabel="filter"
      onClearSelection={clearAllFilters}
      actions={actions}
      className="max-w-2xl"
    />
  );
};
