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
import { useInfertilityCashTrackingShifts } from "./hooks";
import { useInfertilityCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { CashTrackingShift } from "./types";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(amount);
};

function ShiftTable({
  shifts,
  isLoading,
  onSelectShift,
}: {
  shifts: CashTrackingShift[];
  isLoading: boolean;
  onSelectShift: (id: number) => void;
}) {
  if (isLoading && !shifts.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!shifts.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-gray-700">No shifts found</h3>
        <p className="text-xs text-gray-500 mt-1">
          There are no infertility cash tracking records matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Staff
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Start Time
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Collected
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                System Cash
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Variance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {shifts.map((shift) => (
              <tr
                key={shift.id}
                onClick={() => onSelectShift(shift.id)}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">
                    {shift.staff.fullName}
                  </div>
                  <div className="text-xs text-gray-500">{shift.staff.role}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {new Date(shift.startTime).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                      shift.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                    )}
                  >
                    {shift.isActive ? "Active" : "Closed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(shift.totalCollected)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatCurrency(shift.systemCash)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-bold text-xs",
                      shift.variance === 0
                        ? "text-emerald-600"
                        : shift.variance > 0
                        ? "text-blue-600"
                        : "text-rose-600"
                    )}
                  >
                    {shift.variance > 0 ? "+" : ""}
                    {formatCurrency(shift.variance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const InfertilityCashTrackingPage = () => {
  const { filters, setFilter, selectedShiftId, setSelectedShiftId } =
    useInfertilityCashTrackingStore();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilter("search", debouncedSearch);
  }, [debouncedSearch, setFilter]);

  const { data, isLoading, refetch, isFetching } =
    useInfertilityCashTrackingShifts(filters);

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
              title="Infertility Cash Tracking"
              subtitle="Monitor infertility collections and financial flow."
              actions={
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-semibold cursor-pointer active:scale-95"
                >
                  <RefreshCw
                    className={cn("w-4 h-4", isFetching ? "animate-spin" : "")}
                  />
                  <span>Refresh</span>
                </button>
              }
            />
          </div>

          {/* Stats Grid */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-800/60">
                    Net Infertility Cash
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-950">
                  {formatCurrency(summary.totalCollected)}
                </p>
                <p className="text-[10px] sm:text-xs font-medium mt-1 text-emerald-700/80">
                  Total collected from investigations
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-800/60">
                    Total Transactions
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-blue-950">
                  {shifts.reduce((sum, s) => sum + (s.paymentsCount || 0), 0)}
                </p>
                <p className="text-[10px] sm:text-xs font-medium mt-1 text-blue-700/80">
                  Number of payments recorded
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-800/60">
                    Active Shifts
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-indigo-950">
                  {summary.activeShiftsCount}
                </p>
                <p className="text-[10px] sm:text-xs font-medium mt-1 text-indigo-700/80">
                  Staff currently collecting cash
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>

              <div className="w-full md:w-[320px]">
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
                    const formatLocalDate = (date: Date | undefined) => {
                      if (!date) return "";
                      return `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                      ).padStart(2, "0")}-${String(date.getDate()).padStart(
                        2,
                        "0"
                      )}`;
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
                  className="text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* Shifts Table */}
          <div className="px-1 sm:px-2 lg:px-4 pb-10">
            <ShiftTable
              shifts={shifts}
              isLoading={isLoading && !data}
              onSelectShift={(id) => setSelectedShiftId(id)}
            />
          </div>
        </div>
      </div>

      {/* Shift Detail Modal — simplified inline */}
      {selectedShiftId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedShiftId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Shift #{selectedShiftId}
              </h3>
              <button
                onClick={() => setSelectedShiftId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Detailed shift information will be loaded here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfertilityCashTrackingPage;
