"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Wallet,
  Search,
  RefreshCw,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAdminShifts } from "./hooks/useAdminShifts";
import { StatCard } from "@/app/(staff)/dashboard/components/StatCard";
import ShiftTable from "./components/ShiftTable";
import ShiftDetailModal from "./components/ShiftDetailModal";
import { useCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { ShiftStatusFilter } from "./components/ShiftStatusFilter";
import { DateRangePicker } from "@/components/ui/date-range-picker";

const CashTrackingPage = () => {
  const { filters, setFilter, selectedShiftId, setSelectedShiftId } =
    useCashTrackingStore();

  // Local search state for immediate input feedback
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearch = useDebounce(searchTerm, 500);

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
              }
            />
          </div>

          {/* Stats Grid */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <StatCard
                title="Total Collection"
                value={formatCurrency(summary.totalCollected)}
                icon={Wallet}
                color="green"
                isLoading={isLoading && !data}
              />
              <StatCard
                title="Total Refunds"
                value={formatCurrency(summary.totalRefunded)}
                icon={RefreshCw}
                color="red"
                isLoading={isLoading && !data}
              />
              <div className="sm:col-span-2 lg:col-span-1">
                <StatCard
                  title="Active Shifts"
                  value={summary.activeShiftsCount.toString()}
                  icon={Search}
                  color="purple"
                  isLoading={isLoading && !data}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-2 lg:px-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 relative group">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <ShiftStatusFilter
                  currentStatus={filters.status}
                  onStatusChange={(status) => setFilter("status", status)}
                  disabled={isLoading && !data}
                />

                <div className="w-[240px] sm:w-[280px]">
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
                      setFilter(
                        "startDate",
                        range?.from?.toISOString().split("T")[0] || ""
                      );
                      setFilter(
                        "endDate",
                        range?.to?.toISOString().split("T")[0] || ""
                      );
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
                    className="px-2 py-1 text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Minimal Loading Overlay for Filters */}
              {isLoading && !data && (
                <div className="absolute inset-y-0 right-0 w-[60%] sm:w-[45%] bg-white/40 backdrop-blur-[1px] rounded-r-2xl z-10 pointer-events-none transition-opacity" />
              )}
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
      {selectedShiftId && (
        <ShiftDetailModal
          shiftId={selectedShiftId}
          isOpen={!!selectedShiftId}
          onClose={() => setSelectedShiftId(null)}
        />
      )}
    </div>
  );
};

export default CashTrackingPage;
