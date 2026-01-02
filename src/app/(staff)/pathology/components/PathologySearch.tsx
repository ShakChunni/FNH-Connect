"use client";

import React, { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathologyFilterStore } from "../stores/filterStore";
import { FilterTriggerButton, ReportTriggerButton } from "./filter";
import { PathologyPatientData } from "../types";
import { generatePathologyReport } from "../utils/generateReport";
import { exportPathologyToCSV } from "../utils/exportToCSV";
import { useFetchPathologyReportData } from "../hooks/useFetchPathologyReportData";
import { transformPathologyPatients } from "../utils/dataTransformers";
import { toast } from "sonner";

interface PathologySearchProps {
  disabled?: boolean;
  data?: PathologyPatientData[];
}

/**
 * Pathology Search Component
 * Clean search bar with filter and report trigger buttons
 * Connects to Zustand filter store
 */
export const PathologySearch: React.FC<PathologySearchProps> = ({
  disabled = false,
  data = [],
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Get filter state from store
  const filters = usePathologyFilterStore((state) => state.filters);
  const setSearch = usePathologyFilterStore((state) => state.setSearch);

  // Hook for fetching all data for reports
  const { mutateAsync: fetchReportData } = useFetchPathologyReportData();

  // Debounce search value
  const debouncedSearch = useDebounce(searchValue, 300);

  // Effect to sync debounced search with store
  React.useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Sync local state when store's search is cleared externally
  React.useEffect(() => {
    if (filters.search === "" && searchValue !== "") {
      setSearchValue("");
    }
  }, [filters.search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // Helper to fetch all data for report generation
  const fetchAllDataForReport = useCallback(async (): Promise<
    PathologyPatientData[]
  > => {
    try {
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
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      throw error;
    }
  }, [fetchReportData, filters]);

  const handleGenerateSummary = useCallback(async () => {
    setIsGeneratingReport(true);
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

      toast.loading("Generating summary report...", {
        id: "report-generating",
      });
      await generatePathologyReport(allData, "summary", {
        dateRange: filters.dateRange,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        orderedById: filters.orderedById,
        testNames: filters.testNames,
      });
      toast.dismiss("report-generating");
      toast.success(`Summary report generated with ${allData.length} records`);
    } catch (error) {
      toast.dismiss("report-loading");
      toast.dismiss("report-generating");
      toast.error("Failed to generate report");
      console.error("Report generation failed:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [fetchAllDataForReport, filters]);

  const handleGenerateDetailed = useCallback(async () => {
    setIsGeneratingReport(true);
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

      toast.loading("Generating detailed report...", {
        id: "report-generating",
      });
      await generatePathologyReport(allData, "detailed", {
        dateRange: filters.dateRange,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        orderedById: filters.orderedById,
        testNames: filters.testNames,
      });
      toast.dismiss("report-generating");
      toast.success(`Detailed report generated with ${allData.length} records`);
    } catch (error) {
      toast.dismiss("report-loading");
      toast.dismiss("report-generating");
      toast.error("Failed to generate report");
      console.error("Report generation failed:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [fetchAllDataForReport, filters]);

  const handleGenerateFinancial = useCallback(async () => {
    setIsGeneratingReport(true);
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

      toast.loading("Generating financial report...", {
        id: "report-generating",
      });
      // Financial uses the summary with financial focus
      await generatePathologyReport(allData, "summary", {
        dateRange: filters.dateRange,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        orderedById: filters.orderedById,
        testNames: filters.testNames,
      });
      toast.dismiss("report-generating");
      toast.success(
        `Financial report generated with ${allData.length} records`
      );
    } catch (error) {
      toast.dismiss("report-loading");
      toast.dismiss("report-generating");
      toast.error("Failed to generate report");
      console.error("Report generation failed:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [fetchAllDataForReport, filters]);

  const handleExportCSV = useCallback(async () => {
    setIsGeneratingReport(true);
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
      setIsGeneratingReport(false);
    }
  }, [fetchAllDataForReport]);

  return (
    <div
      className="w-full max-w-4xl mx-auto"
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      {/* Mobile Layout: Stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Search Bar - Full Width on Mobile */}
        <div
          className={`
            flex items-center w-full
            bg-white border rounded-full 
            h-11
            transition-all duration-300 ease-out
            ${
              isFocused
                ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          <div className="flex-1 min-w-0 h-full">
            <div className="relative flex items-center h-full">
              <Search
                className={`absolute left-3 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-fnh-blue" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search patient, test number, phone..."
                className="w-full h-full pl-10 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-xs 
                  placeholder:text-gray-400 placeholder:text-xs
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Report & Filter Buttons - 50/50 on Mobile */}
        <div className="flex gap-2 w-full">
          <div className="flex-1 h-11">
            <ReportTriggerButton
              disabled={disabled || isGeneratingReport}
              onGenerateSummary={handleGenerateSummary}
              onGenerateDetailed={handleGenerateDetailed}
              onGenerateFinancial={handleGenerateFinancial}
              onExportCSV={handleExportCSV}
            />
          </div>
          <div className="flex-1 h-11">
            <FilterTriggerButton disabled={disabled} />
          </div>
        </div>
      </div>

      {/* Desktop Layout: Inline */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Main Search Bar Container */}
        <div
          className={`
            flex items-center flex-1 min-w-0
            bg-white border rounded-full 
            h-14
            transition-all duration-300 ease-out
            ${
              isFocused
                ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          {/* Search Input */}
          <div className="flex-1 min-w-0 h-full">
            <div className="relative flex items-center h-full">
              <Search
                className={`absolute left-4 w-5 h-5 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-fnh-blue" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search patient, test number, phone..."
                className="w-full h-full pl-12 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-base 
                  placeholder:text-gray-400 placeholder:text-sm
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Report Trigger Button */}
        <div className="shrink-0 h-14 flex items-center">
          <ReportTriggerButton
            disabled={disabled || isGeneratingReport}
            onGenerateSummary={handleGenerateSummary}
            onGenerateDetailed={handleGenerateDetailed}
            onGenerateFinancial={handleGenerateFinancial}
            onExportCSV={handleExportCSV}
          />
        </div>

        {/* Filter Trigger Button */}
        <div className="shrink-0 h-14 flex items-center">
          <FilterTriggerButton disabled={disabled} />
        </div>
      </div>
    </div>
  );
};

export default PathologySearch;
