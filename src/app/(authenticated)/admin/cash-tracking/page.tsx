"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Wallet,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  HelpCircle,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  Scale,
} from "lucide-react";
import { useAdminShifts } from "./hooks/useAdminShifts";
import ShiftTable from "./components/ShiftTable";
import ShiftDetailModal from "./components/ShiftDetailModal";
import { useCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { ShiftStatusFilter } from "@/components/ui/ShiftStatusFilter";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRangePresets, DateRangePresetValue } from "@/components/ui/DateRangePresets";
import { StaffFilter } from "@/components/ui/StaffFilter";
import { cn } from "@/lib/utils";
import { TONE_BADGE, StatusTone } from "@/lib/statusStyles";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatLocalDate = (date: Date | undefined) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ElementType;
  tone: StatusTone;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center ring-1 ring-inset",
            TONE_BADGE[tone]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-2xs sm:text-xs font-black uppercase tracking-widest text-slate-500">
          {title}
        </span>
      </div>
      {isLoading ? (
        <div className="h-8 w-32 bg-slate-100 rounded animate-pulse mb-1" />
      ) : (
        <div className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tabular-nums truncate">
          {value}
        </div>
      )}
      <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">
        {subtitle}
      </p>
    </div>
  );
};

const CashTrackingPage = () => {
  const { filters, setFilter, selectedShiftId, setSelectedShiftId } =
    useCashTrackingStore();

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [datePreset, setDatePreset] = useState<DateRangePresetValue | null>(null);
  const [showVarianceHelp, setShowVarianceHelp] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useAdminShifts(filters);
  const hasData = !!data;

  const shifts = data?.shifts || [];
  const summary = data?.summary || {
    totalCollected: 0,
    totalRefunded: 0,
    activeShiftsCount: 0,
  };
  const staffOptions = data?.filterOptions?.staff || [];

  const netCashFlow = summary.totalCollected - summary.totalRefunded;
  const totalVariance = shifts.reduce((sum, shift) => sum + shift.variance, 0);
  const totalShifts = shifts.length;
  const totalTransactions = shifts.reduce(
    (sum, shift) => sum + shift._count.payments + shift._count.cashMovements,
    0
  );
  const averageCollection = totalShifts > 0 ? summary.totalCollected / totalShifts : 0;

  const hasActiveFilters = useMemo(
    () =>
      filters.search ||
      filters.status !== "All" ||
      filters.startDate ||
      filters.endDate ||
      filters.staffId !== null,
    [filters]
  );

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    setFilter("startDate", formatLocalDate(range?.from));
    setFilter("endDate", formatLocalDate(range?.to));
    setDatePreset(null);
  };

  const handlePresetChange = (preset: DateRangePresetValue | null) => {
    setDatePreset(preset);
  };

  const handleReset = () => {
    useCashTrackingStore.getState().resetFilters();
    setSearchTerm("");
    setDatePreset(null);
  };

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Cash Tracking"
              subtitle="Monitor staff shifts, collections, refunds, and financial accountability."
              actions={
                <div className="w-full flex justify-center sm:w-auto">
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <RefreshCw
                      className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", {
                        "animate-spin": isFetching,
                      })}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Stats Grid */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              <StatCard
                title="Net Cash Flow"
                value={hasData ? formatCurrency(netCashFlow) : "—"}
                subtitle="Collections minus refunds"
                icon={DollarSign}
                tone="success"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Collected"
                value={hasData ? formatCurrency(summary.totalCollected) : "—"}
                subtitle="Gross incoming payments"
                icon={TrendingUp}
                tone="info"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Refunded"
                value={hasData ? formatCurrency(summary.totalRefunded) : "—"}
                subtitle="Total returned to patients"
                icon={TrendingDown}
                tone="danger"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Active Shifts"
                value={hasData ? summary.activeShiftsCount : "—"}
                subtitle="Staff currently on shift"
                icon={Users}
                tone="info"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Transactions"
                value={hasData ? totalTransactions.toLocaleString("en-BD") : "—"}
                subtitle="Payments & cash movements"
                icon={CreditCard}
                tone="neutral"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Variance"
                value={
                  hasData ? (
                    <span
                      className={cn(
                        totalVariance === 0
                          ? "text-emerald-700"
                          : totalVariance > 0
                          ? "text-blue-700"
                          : "text-red-700"
                      )}
                    >
                      {totalVariance > 0 ? "+" : ""}
                      {formatCurrency(totalVariance)}
                    </span>
                  ) : (
                    "—"
                  )
                }
                subtitle="Cash vs system difference"
                icon={Scale}
                tone="warning"
                isLoading={isLoading && !data}
              />
            </div>

            {/* Variance Explanation */}
            {showVarianceHelp && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-900 mb-1">
                      What is Variance?
                    </h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      <strong>Variance</strong> is the difference between{" "}
                      <strong>Closing Cash</strong> (physically counted money at
                      shift end) and <strong>System Cash</strong> (what the
                      system calculated should be there).
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-indigo-700">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span>
                          <strong>BDT 0 Variance:</strong> Perfect! Cash matches
                          system records.
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>
                          <strong>Positive Variance:</strong> More cash than
                          expected (overage).
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>
                          <strong>Negative Variance:</strong> Less cash than
                          expected (shortage).
                        </span>
                      </li>
                    </ul>
                    <button
                      onClick={() => setShowVarianceHelp(false)}
                      className="mt-3 text-2xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 cursor-pointer"
                    >
                      Got it, close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
              {/* Top Row: Search + Primary Filters */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by staff name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-[42px] pl-10 pr-4 bg-slate-50/50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue/30 transition-colors"
                  />
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
                  <div className="col-span-1 sm:w-[170px]">
                    <StaffFilter
                      staff={staffOptions}
                      currentStaffId={filters.staffId}
                      onStaffChange={(staffId) => setFilter("staffId", staffId)}
                      disabled={isLoading && !data}
                      placeholder="All Staff"
                    />
                  </div>

                  <div className="col-span-1 sm:w-[140px]">
                    <ShiftStatusFilter
                      currentStatus={filters.status}
                      onStatusChange={(status) => setFilter("status", status)}
                      disabled={isLoading && !data}
                    />
                  </div>

                  <div className="col-span-2 sm:w-[260px]">
                    <DateRangePicker
                      value={{
                        from: parseLocalDate(filters.startDate),
                        to: parseLocalDate(filters.endDate),
                      }}
                      onChange={handleDateRangeChange}
                      placeholder="Filter by date range"
                      disabled={isLoading && !data}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Quick Date Presets + Clear */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1.5 text-2xs font-black text-slate-500 uppercase tracking-widest shrink-0">
                    <Calendar className="w-3 h-3" />
                    Quick Date
                  </span>
                  <DateRangePresets
                    onChange={handleDateRangeChange}
                    activePreset={datePreset}
                    onActivePresetChange={handlePresetChange}
                    disabled={isLoading && !data}
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    disabled={isLoading && !data}
                    className="self-start sm:self-center h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 sm:p-5 bg-fnh-navy rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xs sm:text-xs font-black uppercase tracking-widest opacity-80">
                  Cash Flow Breakdown
                </h3>
                <span className="text-2xs font-bold text-white/60">
                  {totalShifts} shift{totalShifts !== 1 ? "s" : ""} shown
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/5">
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-2xs font-bold uppercase tracking-wide opacity-70 truncate">
                      Collected
                    </p>
                    <p
                      className="text-base sm:text-lg font-black tabular-nums truncate"
                      title={formatCurrency(summary.totalCollected)}
                    >
                      {formatCurrency(summary.totalCollected)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/5">
                  <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-2xs font-bold uppercase tracking-wide opacity-70 truncate">
                      Refunded
                    </p>
                    <p
                      className="text-base sm:text-lg font-black tabular-nums truncate"
                      title={formatCurrency(summary.totalRefunded)}
                    >
                      {formatCurrency(summary.totalRefunded)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                  <Wallet className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-2xs font-bold uppercase tracking-wide opacity-90 truncate">
                      Net Cash
                    </p>
                    <p
                      className="text-base sm:text-lg font-black tabular-nums text-emerald-300 truncate"
                      title={formatCurrency(netCashFlow)}
                    >
                      {formatCurrency(netCashFlow)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 sm:hidden text-xs text-white/70 text-center">
                {formatCurrency(summary.totalCollected)} collected −{" "}
                {formatCurrency(summary.totalRefunded)} refunded ={" "}
                <span className="text-emerald-300 font-bold">
                  {formatCurrency(netCashFlow)}
                </span>
              </p>
            </div>
          </div>

          {/* Shifts Table */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            <ShiftTable
              shifts={shifts}
              isLoading={isLoading && !data}
              isError={isError && !data}
              onRetry={() => refetch()}
              onSelectShift={(shift) => setSelectedShiftId(shift.id)}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ShiftDetailModal
        shiftId={selectedShiftId ?? 0}
        isOpen={selectedShiftId !== null}
        onClose={() => setSelectedShiftId(null)}
      />
    </div>
  );
};

export default CashTrackingPage;
