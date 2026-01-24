"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAdminShifts } from "./hooks/useAdminShifts";
import ShiftTable from "./components/ShiftTable";
import ShiftDetailModal from "./components/ShiftDetailModal";
import { useCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { ShiftStatusFilter } from "./components/ShiftStatusFilter";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";

const CashTrackingPage = () => {
  const { filters, setFilter, selectedShiftId, setSelectedShiftId } =
    useCashTrackingStore();

  // Local search state for immediate input feedback
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Tooltip state
  const [showVarianceHelp, setShowVarianceHelp] = useState(false);

  // Sync debounced search to store
  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const { data, isLoading, refetch, isFetching } = useAdminShifts(filters);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const shifts = data?.shifts || [];
  const summary = data?.summary || {
    totalCollected: 0,
    totalRefunded: 0,
    activeShiftsCount: 0,
  };

  // Calculate net cash flow
  const netCashFlow = summary.totalCollected - summary.totalRefunded;

  // Calculate total variance across all shifts
  const totalVariance = shifts.reduce((sum, shift) => sum + shift.variance, 0);

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Cash Tracking"
              subtitle="Monitor staff shifts, collections, and financial accountability."
              actions={
                <div className="w-full flex justify-center sm:w-auto">
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        isFetching ? "animate-spin" : ""
                      }`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              }
            />
          </div>

          {/* Enhanced Stats Grid - Mobile First */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {/* Net Cash Flow */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 lg:p-6 border border-emerald-100 shadow-sm shadow-emerald-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-900/60">
                      Net Cash Flow
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-emerald-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p
                      className="text-xl sm:text-2xl xl:text-3xl font-black text-emerald-950 truncate"
                      title={formatCurrency(netCashFlow)}
                    >
                      {formatCurrency(netCashFlow)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-emerald-700/80">
                    Collections minus refunds
                  </p>
                </div>
              </div>

              {/* Total Collected */}
              <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 lg:p-6 border border-blue-100 shadow-sm shadow-blue-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-900/60">
                      Total Collected
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-blue-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p
                      className="text-xl sm:text-2xl xl:text-3xl font-black text-blue-950 truncate"
                      title={formatCurrency(summary.totalCollected)}
                    >
                      {formatCurrency(summary.totalCollected)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-blue-700/80">
                    Gross incoming payments
                  </p>
                </div>
              </div>

              {/* Total Refunds */}
              <div className="bg-rose-50/50 rounded-2xl p-4 sm:p-5 lg:p-6 border border-rose-100 shadow-sm shadow-rose-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-900/60">
                      Total Refunds
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-rose-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p
                      className="text-xl sm:text-2xl xl:text-3xl font-black text-rose-950 truncate"
                      title={formatCurrency(summary.totalRefunded)}
                    >
                      {formatCurrency(summary.totalRefunded)}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs font-medium mt-1 text-rose-700/80">
                    Total returned to patients
                  </p>
                </div>
              </div>

              {/* Active Shifts */}
              <div className="bg-violet-50/50 rounded-2xl p-4 sm:p-5 lg:p-6 border border-violet-100 shadow-sm shadow-violet-100/20 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-violet-900/60">
                      Active Shifts
                    </span>
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-violet-100/50 rounded animate-pulse mb-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl xl:text-3xl font-black text-violet-950">
                      {summary.activeShiftsCount}
                    </p>
                  )}

                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <p className="text-[10px] sm:text-xs font-medium text-violet-700/80">
                      Variance:
                    </p>
                    {isLoading ? (
                      <div className="h-3 w-12 bg-white/50 rounded animate-pulse" />
                    ) : (
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap",
                          totalVariance === 0
                            ? "bg-white text-emerald-600 ring-1 ring-emerald-100"
                            : totalVariance > 0
                              ? "bg-white text-blue-600 ring-1 ring-blue-100"
                              : "bg-white text-rose-600 ring-1 ring-rose-100",
                        )}
                      >
                        {totalVariance > 0 ? "+" : ""}
                        {formatCurrency(totalVariance)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVarianceHelp(!showVarianceHelp);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer -ml-1 shrink-0"
                      aria-label="What is variance?"
                    >
                      <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Variance Explanation Tooltip */}
            {showVarianceHelp && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
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
                        <span className="w-2 h-2 bg-rose-500 rounded-full" />
                        <span>
                          <strong>Negative Variance:</strong> Less cash than
                          expected (shortage).
                        </span>
                      </li>
                    </ul>
                    <button
                      onClick={() => setShowVarianceHelp(false)}
                      className="mt-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 cursor-pointer"
                    >
                      Got it, close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters - Mobile Optimized */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 relative group">
              {/* Search Input */}
              <div className="flex-1 min-w-[180px] sm:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-all"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
                <ShiftStatusFilter
                  currentStatus={filters.status}
                  onStatusChange={(status) => setFilter("status", status)}
                  disabled={isLoading && !data}
                />

                <div className="w-full sm:w-[240px] lg:w-[280px]">
                  <DateRangePicker
                    value={{
                      from: filters.startDate
                        ? new Date(filters.startDate)
                        : undefined,
                      to: filters.endDate
                        ? new Date(filters.endDate)
                        : undefined,
                    }}
                    onChange={(range) => {
                      // Use local date format to prevent UTC timezone conversion
                      const formatLocalDate = (date: Date | undefined) => {
                        if (!date) return "";
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      };
                      setFilter("startDate", formatLocalDate(range?.from));
                      setFilter("endDate", formatLocalDate(range?.to));
                    }}
                    placeholder="Filter by date range"
                    disabled={isLoading && !data}
                  />
                </div>

                {(filters.search ||
                  filters.status !== "All" ||
                  filters.startDate ||
                  filters.endDate) && (
                  <button
                    onClick={() => {
                      useCashTrackingStore.getState().resetFilters();
                      setSearchTerm("");
                    }}
                    disabled={isLoading && !data}
                    className="px-3 py-2 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Minimal Loading Overlay for Filters */}
              {isLoading && !data && (
                <div className="absolute inset-y-0 right-0 w-[60%] sm:w-[45%] bg-white/40 backdrop-blur-[1px] rounded-r-2xl z-10 pointer-events-none transition-opacity" />
              )}
            </div>
          </div>

          {/* Cash Flow Breakdown - Visual Summary */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-fnh-navy to-slate-800 rounded-2xl text-white">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80 mb-4">
                Cash Flow Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Collections */}
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/5">
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 truncate">
                      Collected
                    </p>
                    <p
                      className="text-base sm:text-lg font-black truncate"
                      title={formatCurrency(summary.totalCollected)}
                    >
                      {formatCurrency(summary.totalCollected)}
                    </p>
                  </div>
                </div>

                {/* Refunds */}
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/5">
                  <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 truncate">
                      Refunded
                    </p>
                    <p
                      className="text-base sm:text-lg font-black truncate"
                      title={formatCurrency(summary.totalRefunded)}
                    >
                      {formatCurrency(summary.totalRefunded)}
                    </p>
                  </div>
                </div>

                {/* Net */}
                <div className="flex items-center gap-3 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                  <Wallet className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-90 truncate">
                      Net Cash
                    </p>
                    <p
                      className="text-base sm:text-lg font-black text-emerald-300 truncate"
                      title={formatCurrency(netCashFlow)}
                    >
                      {formatCurrency(netCashFlow)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary text for mobile */}
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
