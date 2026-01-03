"use client";

import React, { useMemo, useState, useCallback } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import {
  FloatingActionBar,
  FloatingAction,
} from "@/components/ui/FloatingActionBar";
import { useFilterStore } from "../../../stores/filterStore";
import { AdmissionPatientData } from "../../../types";
import { generateAdmissionsReport } from "../../../utils/generateReport";
import {
  exportAdmissionsToExcel,
  ExportFilterMeta,
} from "../../../utils/exportToExcel";
import { useFetchAdmissionsReportData } from "../../../hooks/useFetchAdmissionsReportData";
import { useFetchDepartments } from "../../../hooks/useFetchDepartments";
import { useFetchDoctors } from "../../../hooks/useFetchDoctors";
import { toast } from "sonner";

interface ExportActionBarProps {
  data: AdmissionPatientData[];
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const filters = useFilterStore((state) => state.filters);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const getActiveFilterCount = useFilterStore(
    (state) => state.getActiveFilterCount
  );
  const activeCount = getActiveFilterCount();

  // Hook for fetching all data for reports
  const { mutateAsync: fetchReportData } = useFetchAdmissionsReportData();

  // Fetch departments and doctors for filter naming
  const { data: departments = [] } = useFetchDepartments();
  const { data: doctors = [] } = useFetchDoctors();

  // Get department and doctor names for file naming
  const getFilterMeta = useCallback((): ExportFilterMeta => {
    const departmentName = filters.departmentId
      ? departments.find((d) => d.id === filters.departmentId)?.name
      : undefined;
    const doctorName = filters.doctorId
      ? doctors.find((d) => d.id === filters.doctorId)?.fullName
      : undefined;

    return {
      departmentName,
      doctorName,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
    };
  }, [filters, departments, doctors]);

  // Show only when filters are active
  const shouldShow = activeCount > 0;

  // Helper to fetch all data for report generation
  const fetchAllDataForReport = useCallback(async (): Promise<
    AdmissionPatientData[]
  > => {
    const reportFilters = {
      search: filters.search.length >= 2 ? filters.search : undefined,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      status: filters.status !== "All" ? filters.status : undefined,
      departmentId: filters.departmentId ?? undefined,
      doctorId: filters.doctorId ?? undefined,
    };

    return await fetchReportData(reportFilters);
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
        await generateAdmissionsReport(allData, type, {
          dateRange: filters.dateRange,
          startDate: filters.startDate,
          endDate: filters.endDate,
          department: filters.departmentId?.toString(),
          status: filters.status,
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

  const handleExcelExport = useCallback(async () => {
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

      exportAdmissionsToExcel(allData, getFilterMeta());
      toast.success(`Exported ${allData.length} records to Excel`);
    } catch (error) {
      toast.dismiss("export-loading");
      toast.error("Failed to export data");
      console.error("Export failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [fetchAllDataForReport, getFilterMeta]);

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
        label: isGenerating ? "Exporting..." : "Export to Excel",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        onClick: handleExcelExport,
        disabled: isGenerating,
      },
    ],
    [handlePdfExport, handleExcelExport, isGenerating]
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
