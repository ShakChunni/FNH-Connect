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
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  Scale,
} from "lucide-react";
import { useInfertilityCashTrackingShifts } from "./hooks";
import { useInfertilityCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRangePresets, DateRangePresetValue } from "@/components/ui/DateRangePresets";
import { StaffFilter } from "@/components/ui/StaffFilter";
import { ShiftStatusFilter } from "@/components/ui/ShiftStatusFilter";
import { ShiftTable } from "./components/ShiftTable";
import { ShiftDetailModal } from "./components/ShiftDetailModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/AuthContext";
import { isAdminRole } from "@/lib/roles";
import { useRouter } from "next/navigation";

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
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "text-emerald-700",
      title: "text-emerald-800",
      subtitle: "text-emerald-700",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "text-blue-600",
      title: "text-blue-800",
      subtitle: "text-blue-700",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-100",
      icon: "text-rose-600",
      title: "text-rose-800",
      subtitle: "text-rose-700",
    },
    violet: {
      bg: "bg-violet-50",
      border: "border-violet-100",
      icon: "text-violet-600",
      title: "text-violet-800",
      subtitle: "text-violet-700",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "text-amber-700",
      title: "text-amber-800",
      subtitle: "text-amber-700",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      icon: "text-indigo-600",
      title: "text-indigo-800",
      subtitle: "text-indigo-700",
    },
  };

  const style = colorStyles[color];

  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5 lg:p-6 border shadow-sm relative overflow-hidden transition-colors",
        style.bg,
        style.border
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Icon className={cn("w-4 h-4", style.icon)} />
          </div>
          <span
            className={cn(
              "text-2xs sm:text-xs font-black uppercase tracking-widest",
              style.title
            )}
          >
            {title}
          </span>
        </div>
        {isLoading ? (
          <div className="h-8 w-32 bg-white rounded animate-pulse mb-1" />
        ) : (
          <div className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-950 truncate tabular-nums">
            {value}
          </div>
        )}
        <p className={cn("text-2xs sm:text-xs font-medium mt-1", style.subtitle)}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

const InfertilityCashTrackingPage = () => {
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();
  const { filters, setFilter, selectedShiftId, setSelectedShiftId } =
    useInfertilityCashTrackingStore();
  const canViewCashTracking = Boolean(user?.role && isAdminRole(user.role));

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [datePreset, setDatePreset] = useState<DateRangePresetValue | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  useEffect(() => {
    if (!isAuthLoading && !canViewCashTracking) {
      router.replace("/infertility");
    }
  }, [canViewCashTracking, isAuthLoading, router]);

  const { data, isLoading, isError, refetch, isFetching } =
    useInfertilityCashTrackingShifts(filters, {
      enabled: canViewCashTracking,
    });

  const shifts = data?.shifts || [];
  const summary = data?.summary || {
    totalCollected: 0,
    totalRefunded: 0,
    activeShiftsCount: 0,
  };
  const staffOptions = data?.filterOptions?.staff || [];
  const canSelectStaff = data?.canSelectStaff ?? false;

  const netCashFlow = summary.totalCollected - summary.totalRefunded;
  const totalVariance = shifts.reduce((sum, shift) => sum + shift.variance, 0);
  const totalShifts = shifts.length;
  const totalTransactions = shifts.reduce(
    (sum, shift) => sum + (shift.paymentsCount || 0) + (shift.cashMovementsCount || 0),
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
    useInfertilityCashTrackingStore.getState().resetFilters();
    setSearchTerm("");
    setDatePreset(null);
  };

  if (isAuthLoading || !canViewCashTracking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="HSI Center Cash Tracking"
              subtitle="Monitor HSI Center staff shifts, collections, refunds, and financial accountability."
              actions={
                <div className="w-full flex justify-center sm:w-auto">
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs sm:text-sm font-semibold cursor-pointer "
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              <StatCard
                title="Net HSI Cash"
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
                        ? "text-emerald-700"
                        : totalVariance > 0
                        ? "text-blue-700"
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
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative group space-y-3 sm:space-y-4">
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
                  {canSelectStaff ? (
                    <div className="col-span-1 sm:w-[170px]">
                      <StaffFilter
                        staff={staffOptions}
                        currentStaffId={filters.staffId}
                        onStaffChange={(staffId) => setFilter("staffId", staffId)}
                        disabled={isLoading && !data}
                        placeholder="All Staff"
                      />
                    </div>
                  ) : null}

                  <div className="col-span-1 sm:w-[140px]">
                    <ShiftStatusFilter
                      currentStatus={filters.status}
                      onStatusChange={(status) =>
                        setFilter("status", status as "Active" | "Closed" | "All")
                      }
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
                    className="self-start sm:self-center px-3 py-2 text-2xs sm:text-xs font-black text-slate-600 uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Loading Overlay */}
              {isLoading && !data && (
                <div className="absolute inset-0 bg-white/40 rounded-2xl z-10 pointer-events-none transition-opacity" />
              )}
            </div>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 sm:p-5 bg-fnh-navy rounded-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xs sm:text-xs font-black uppercase tracking-widest opacity-80">
                  HSI Center Cash Flow Breakdown
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
                    <p className="text-2xs font-bold uppercase tracking-wide opacity-70 truncate">
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
                    <p className="text-2xs font-bold uppercase tracking-wide opacity-90 truncate">
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
            {isError && !data ? (
              <div
                role="alert"
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
              >
                <p className="text-sm font-medium text-red-700">
                  Could not load cash tracking data.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : (
              <ShiftTable
                shifts={shifts}
                isLoading={isLoading && !data}
                onSelectShift={(shift) => setSelectedShiftId(shift.id)}
              />
            )}
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

export default InfertilityCashTrackingPage;
