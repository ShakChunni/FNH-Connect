"use client";

import React, { useMemo } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import {
  FloatingActionBar,
  FloatingAction,
} from "@/components/ui/FloatingActionBar";
import { usePathologyFilterStore } from "../../../stores";
import { PathologyPatientData } from "../../../types";
import { generatePathologyReport } from "../../../utils/generateReport";
import { exportPathologyToCSV } from "../../../utils/exportToCSV";

interface ExportActionBarProps {
  data: PathologyPatientData[];
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({ data }) => {
  const filters = usePathologyFilterStore((state) => state.filters);
  const clearAllFilters = usePathologyFilterStore(
    (state) => state.clearAllFilters
  );
  const getActiveFilterCount = usePathologyFilterStore(
    (state) => state.getActiveFilterCount
  );
  const activeCount = getActiveFilterCount();

  // Show only when filters are active
  const shouldShow = activeCount > 0;

  const handlePdfExport = (type: "summary" | "detailed") => {
    generatePathologyReport(data, type, {
      dateRange: filters.dateRange,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      orderedById: filters.orderedById,
      testCategories: filters.testCategories,
    });
  };

  const handleCSVExport = () => {
    exportPathologyToCSV(data);
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
        label: "Export to CSV",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        onClick: handleCSVExport,
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
