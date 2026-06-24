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
  color: "emerald" | "blue" | "rose" | "violet" | "amber" | "indigo";
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  isLoading,
}) => {
  const colorStyles = {
    emerald: {
      bg: "bg-emerald-50/50",
      border: "border-emerald-100",
      blob: "bg-emerald-100/50",
      icon: "text-emerald-600",
      title: "text-emerald-900/60",
      subtitle: "text-emerald-700/80",
    },
    blue: {
      bg: "bg-blue-50/50",
      border: "border-blue-100",
      blob: "bg-blue-100/50",
      icon: "text-blue-600",
      title: "text-blue-900/60",
      subtitle: "text-blue-700/80",
    },
    rose: {
      bg: "bg-rose-50/50",
      border: "border-rose-100",
      blob: "bg-rose-100/50",
      icon: "text-rose-600",
      title: "text-rose-900/60",
      subtitle: "text-rose-700/80",
    },
    violet: {
      bg: "bg-violet-50/50",
      border: "border-violet-100",
      blob: "bg-violet-100/50",
      icon: "text-violet-600",
      title: "text-violet-900/60",
      subtitle: "text-violet-700/80",
    },
    amber: {
      bg: "bg-amber-50/50",
      border: "border-amber-100",
      blob: "bg-amber-100/50",
      icon: "text-amber-600",
      title: "text-amber-900/60",
      subtitle: "text-amber-700/80",
    },
    indigo: {
      bg: "bg-indigo-50/50",
      border: "border-indigo-100",
      blob: "bg-indigo-100/50",
      icon: "text-indigo-600",
      title: "text-indigo-900/60",
      subtitle: "text-indigo-700/80",
    },
  };

  const style = colorStyles[color];

  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5 lg:p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300",
        style.bg,
        style.border
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500",
          style.blob
        )}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Icon className={cn("w-4 h-4", style.icon)} />
          </div>
          <span
            className={cn(
              "text-[10px] sm:text-xs font-black uppercase tracking-widest",
              style.title
            )}
          >
            {title}
          </span>
        </div>
        {isLoading ? (
          <div className="h-8 w-32 bg-white/50 rounded animate-pulse mb-1" />
        ) : (
          <div className="text-xl sm:text-2xl xl:text-3xl font-black text-gray-950 truncate">
            {value}
          </div>
        )}
        <p className={cn("text-[10px] sm:text-xs font-medium mt-1", style.subtitle)}>
          {subtitle}
        </p>
      </div>
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

  const { data, isLoading, refetch, isFetching } = useAdminShifts(filters);

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
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
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
                value={formatCurrency(netCashFlow)}
                subtitle="Collections minus refunds"
                icon={DollarSign}
                color="emerald"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Collected"
                value={formatCurrency(summary.totalCollected)}
                subtitle="Gross incoming payments"
                icon={TrendingUp}
                color="blue"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Refunded"
                value={formatCurrency(summary.totalRefunded)}
                subtitle="Total returned to patients"
                icon={TrendingDown}
                color="rose"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Active Shifts"
                value={summary.activeShiftsCount}
                subtitle="Staff currently on shift"
                icon={Users}
                color="violet"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Transactions"
                value={totalTransactions.toLocaleString("en-BD")}
                subtitle="Payments & cash movements"
                icon={CreditCard}
                color="indigo"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Variance"
                value={
                  <span
                    className={cn(
                      totalVariance === 0
                        ? "text-emerald-600"
                        : totalVariance > 0
                        ? "text-blue-600"
                        : "text-rose-600"
                    )}
                  >
                    {totalVariance > 0 ? "+" : ""}
                    {formatCurrency(totalVariance)}
                  </span>
                }
                subtitle="Cash vs system difference"
                icon={Scale}
                color="amber"
                isLoading={isLoading && !data}
              />
            </div>

            {/* Variance Explanation */}
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

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm relative group space-y-3 sm:space-y-4">
              {/* Top Row: Search + Primary Filters */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by staff name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-[42px] pl-10 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue/30 transition-all"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
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
                    className="self-start sm:self-center px-3 py-2 text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Loading Overlay */}
              {isLoading && !data && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl z-10 pointer-events-none transition-opacity" />
              )}
            </div>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-fnh-navy to-slate-800 rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80">
                  Cash Flow Breakdown
                </h3>
                <span className="text-[10px] font-bold text-white/60">
                  {totalShifts} shift{totalShifts !== 1 ? "s" : ""} shown
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
