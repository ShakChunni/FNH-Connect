"use client";

import React, { useMemo } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import {
  FloatingActionBar,
  FloatingAction,
} from "@/components/ui/FloatingActionBar";
import { useFilterStore } from "../../../stores/filterStore";
import { AdmissionPatientData } from "../../../types";
import { generateAdmissionsReport } from "../../../utils/generateReport";
import { exportAdmissionsToExcel } from "../../../utils/exportToExcel";

interface ExportActionBarProps {
  data: AdmissionPatientData[];
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({ data }) => {
  const filters = useFilterStore((state) => state.filters);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const getActiveFilterCount = useFilterStore(
    (state) => state.getActiveFilterCount
  );
  const activeCount = getActiveFilterCount();

  // Show only when filters are active
  const shouldShow = activeCount > 0;

  const handlePdfExport = (type: "summary" | "detailed") => {
    generateAdmissionsReport(data, type, {
      dateRange: filters.dateRange,
      startDate: filters.startDate,
      endDate: filters.endDate,
      department: filters.departmentId?.toString(),
      status: filters.status,
    });
  };

  const handleExcelExport = () => {
    exportAdmissionsToExcel(data);
  };

  const actions: FloatingAction[] = useMemo(
    () => [
      {
        label: "PDF Summary Report",
        icon: <FileText className="w-4 h-4" />,
        onClick: () => handlePdfExport("summary"),
      },
      {
        label: "PDF Detailed Report",
        icon: <Download className="w-4 h-4" />,
        onClick: () => handlePdfExport("detailed"),
      },
      {
        label: "Export to Excel",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        onClick: handleExcelExport,
      },
    ],
    [data, filters]
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
