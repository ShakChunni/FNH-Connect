"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import { useAuth } from "@/app/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useNotification } from "@/hooks/useNotification";
import {
  buildBDTQueryDateRange,
  getBDTPresetCalendarRange,
} from "@/lib/timezone";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { DOCTOR_CHAMBER_CONFIG } from "@/lib/doctorChamber";
import DoctorChamberFilters, {
  type DoctorChamberDateRange,
} from "./components/DoctorChamberFilters";
import DoctorChamberForm from "./components/DoctorChamberForm";
import DoctorChamberOverview from "./components/DoctorChamberOverview";
import DoctorChamberSearch from "./components/DoctorChamberSearch";
import DoctorChamberTable from "./components/DoctorChamberTable";
import {
  fetchDoctorChamberReport,
  useDoctorChamberConfig,
  useDoctorChamberVisits,
} from "./hooks/useDoctorChamber";
import { exportDoctorChamberToExcel } from "./utils/exportToExcel";
import { generateDoctorChamberReport } from "./utils/generateReport";
import type { DoctorChamberVisitRecord } from "./types";

function formatPeriod(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return "All Time";

  const formatter = new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start} - ${end}`;
}

const NewPatientButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-emerald-700 hover:to-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
  >
    <Plus className="h-5 w-5" />
    <span>New Patient</span>
  </button>
);

export default function DoctorChamberPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dateRange, setDateRange] = useState<DoctorChamberDateRange>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<DoctorChamberVisitRecord | null>(null);
  const [overviewVisit, setOverviewVisit] = useState<DoctorChamberVisitRecord | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { data: chamberConfig } = useDoctorChamberConfig();

  const queryDateRange = useMemo(
    () => buildBDTQueryDateRange(startDate, endDate),
    [startDate, endDate],
  );
  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      ...queryDateRange,
      page,
      limit: 15,
    }),
    [debouncedSearch, page, queryDateRange],
  );
  const { data, isLoading, isFetching, error } = useDoctorChamberVisits(filters);
  const visits = data?.data ?? [];
  const totalRecords = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const doctorName = chamberConfig?.doctorName ?? DOCTOR_CHAMBER_CONFIG.doctorDisplayName;

  const openNewVisit = () => {
    setEditingVisit(null);
    setIsFormOpen(true);
  };

  const openEditVisit = (visit: DoctorChamberVisitRecord) => {
    setEditingVisit(visit);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    setIsFormOpen(false);
    setEditingVisit(null);
  };

  const handleDateRangeChange = (nextRange: DoctorChamberDateRange) => {
    setDateRange(nextRange);
    setPage(1);

    if (nextRange === "all" || nextRange === "custom") {
      if (nextRange === "all") {
        setStartDate(null);
        setEndDate(null);
      }
      return;
    }

    const range = getBDTPresetCalendarRange(nextRange);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const handleCustomDateRange = (start: Date | null, end: Date | null) => {
    setDateRange("custom");
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const clearFilters = () => {
    setDateRange("all");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const getReportData = useCallback(async () => {
    const report = await fetchDoctorChamberReport({
      search: debouncedSearch.trim() || undefined,
      ...queryDateRange,
    });

    if (report.data.length === 0) {
      showNotification("No chamber visits match the selected filters.", "info");
      return null;
    }

    return report.data;
  }, [debouncedSearch, queryDateRange, showNotification]);

  const generateReport = async (type: "summary" | "detailed") => {
    setIsGeneratingReport(true);
    try {
      const reportData = await getReportData();
      if (!reportData) return;

      await generateDoctorChamberReport(
        reportData,
        type,
        formatPeriod(startDate, endDate),
      );
      showNotification(
        `${type === "summary" ? "Summary" : "Detailed"} chamber report generated.`,
        "success",
      );
    } catch (reportError) {
      console.error("Doctor chamber report generation failed:", reportError);
      showNotification("Unable to generate chamber report.", "error");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportExcel = async () => {
    setIsGeneratingReport(true);
    try {
      const reportData = await getReportData();
      if (!reportData) return;

      await exportDoctorChamberToExcel(
        reportData,
        formatPeriod(startDate, endDate),
        user?.fullName || "Staff",
      );
      showNotification("Chamber Excel report downloaded.", "success");
    } catch (exportError) {
      console.error("Doctor chamber Excel export failed:", exportError);
      showNotification("Unable to export chamber report.", "error");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4">
      <div className="mx-auto w-full max-w-full px-3 pt-16 sm:px-4 sm:pt-12 lg:px-6 lg:pt-2">
        <div className="w-full space-y-4 sm:space-y-5 lg:space-y-6">
          <div className="px-1 pb-4 sm:px-2 lg:px-4 lg:pb-8">
            <PageHeader
              title="Dr Sufia Khatun Chamber"
              subtitle={`Private chamber patient records · ${doctorName}`}
              actions={<NewPatientButton onClick={openNewVisit} disabled={isLoading} />}
            />
          </div>

          <div className="px-0 pb-2 sm:px-2 sm:pb-4 lg:px-4 lg:pb-6">
            <DoctorChamberSearch
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              onOpenFilters={() => setIsFilterOpen(true)}
              activeFilterCount={dateRange === "all" ? 0 : 1}
              onGenerateSummary={() => void generateReport("summary")}
              onGenerateDetailed={() => void generateReport("detailed")}
              onExportExcel={() => void exportExcel()}
              disabled={isLoading || isGeneratingReport}
            />
          </div>

          {isFetching && !isLoading && (
            <div className="px-0 text-center text-xs font-medium text-fnh-blue sm:px-2 lg:px-4">
              Refreshing patient records…
            </div>
          )}

          {error && (
            <div className="px-0 sm:px-2 lg:px-4">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load chamber patients. Please refresh and try again.
              </div>
            </div>
          )}

          <div className="px-0 sm:px-2 lg:px-4">
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm sm:mb-8 sm:rounded-3xl">
              <DoctorChamberTable
                visits={visits}
                isLoading={isLoading}
                startIndex={(page - 1) * 15}
                printedBy={user?.fullName || "Staff"}
                onEdit={openEditVisit}
                onView={setOverviewVisit}
              />
            </div>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalResults={totalRecords}
                  startIndex={totalRecords > 0 ? (page - 1) * 15 + 1 : 0}
                  endIndex={Math.min(page * 15, totalRecords)}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <DoctorChamberFilters
        isOpen={isFilterOpen}
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setIsFilterOpen(false)}
        onClear={clearFilters}
        onDateRangeChange={handleDateRangeChange}
        onCustomDateRange={handleCustomDateRange}
      />

      <ClientPortal>
        <DoctorChamberForm
          isOpen={isFormOpen}
          editingVisit={editingVisit}
          printedBy={user?.fullName || "Staff"}
          onClose={() => {
            if (!isGeneratingReport) {
              setIsFormOpen(false);
              setEditingVisit(null);
            }
          }}
          onSaved={handleSaved}
        />
      </ClientPortal>
      <DoctorChamberOverview
        visit={overviewVisit}
        isOpen={Boolean(overviewVisit)}
        onClose={() => setOverviewVisit(null)}
        printedBy={user?.fullName || "Staff"}
      />
    </div>
  );
}
