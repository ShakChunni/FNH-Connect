"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Wallet,
  Search,
  RefreshCw,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
} from "lucide-react";
import { useInfertilityShifts } from "./hooks";
import ShiftTable from "./components/ShiftTable";
import ShiftDetailModal from "./components/ShiftDetailModal";
import { useInfertilityCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";

const InfertilityCashTrackingPage = () => {
  const { filters, setFilter, selectedShiftId, setSelectedShiftId } = useInfertilityCashTrackingStore();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useInfertilityShifts(filters);
  const hasData = !!data;

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

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="HSI Center Cash Tracking"
              subtitle="Monitor HSI Center collections and financial flow."
              actions={
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm font-semibold cursor-pointer"
                >
                  <RefreshCw className={cn("w-4 h-4", isFetching ? "animate-spin" : "")} />
                  <span>Refresh</span>
                </button>
              }
            />
          </div>

          {/* Stats Grid */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Net Infertility Cash</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{hasData ? formatCurrency(summary.totalCollected) : "—"}</p>
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">Total collected from investigations</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Total Investigations</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                  {hasData ? shifts.reduce((sum, s) => sum + ((s as any).infertilityPaymentsCount || 0), 0) : "—"}
                </p>
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">Number of paid investigations</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-700" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Active Shifts</span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{hasData ? summary.activeShiftsCount : "—"}</p>
                <p className="text-2xs sm:text-xs font-medium mt-1 text-slate-500">Staff currently collecting cash</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-colors"
                />
              </div>

              <div className="w-full md:w-[320px]">
                <DateRangePicker
                  value={{
                    from: filters.startDate ? new Date(filters.startDate) : undefined,
                    to: filters.endDate ? new Date(filters.endDate) : undefined,
                  }}
                  onChange={(range) => {
                    const formatLocalDate = (date: Date | undefined) => {
                      if (!date) return "";
                      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                    };
                    setFilter("startDate", formatLocalDate(range?.from));
                    setFilter("endDate", formatLocalDate(range?.to));
                  }}
                  placeholder="Filter by date range"
                />
              </div>

              {searchTerm || filters.startDate ? (
                <button
                  onClick={() => {
                    useInfertilityCashTrackingStore.getState().resetFilters();
                    setSearchTerm("");
                  }}
                  className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          {/* Shifts Table */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            <ShiftTable
              shifts={shifts}
              isLoading={isLoading && !data}
              isError={isError && !data}
              onRetry={() => refetch()}
              onSelectShift={(id) => setSelectedShiftId(id)}
            />
          </div>
        </div>
      </div>

      <ShiftDetailModal
        shiftId={selectedShiftId ?? 0}
        isOpen={selectedShiftId !== null}
        onClose={() => setSelectedShiftId(null)}
      />
    </div>
  );
};

export default InfertilityCashTrackingPage;
