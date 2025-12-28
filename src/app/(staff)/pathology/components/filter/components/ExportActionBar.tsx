"use client";

import React, { useMemo } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import {
  FloatingActionBar,
  FloatingAction,
} from "@/components/ui/FloatingActionBar";
import { usePathologyFilterStore } from "../../../stores/filterStore";
import { PathologyPatientData } from "../../../types";

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

  // TODO: Add PDF/Excel export functions for pathology
  const handlePdfExport = () => {
    console.log("PDF export for pathology data:", data.length, "records");
    // TODO: Implement generatePathologyReport(data, filters)
  };

  const handleExcelExport = () => {
    console.log("Excel export for pathology data:", data.length, "records");
    // TODO: Implement exportPathologyToExcel(data)
  };

  const actions: FloatingAction[] = useMemo(
    () => [
      {
        label: "PDF Report",
        icon: <FileText className="w-4 h-4" />,
        onClick: handlePdfExport,
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
