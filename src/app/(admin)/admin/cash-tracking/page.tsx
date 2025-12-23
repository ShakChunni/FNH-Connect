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
import DashboardSkeleton from "./components/DashboardSkeleton";
import { useCashTrackingStore } from "./store";
import { useDebounce } from "@/hooks/useDebounce";
import { ShiftStatusFilter } from "./components/ShiftStatusFilter";

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
    <div className="min-h-screen bg-fnh-porcelain pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-8 pt-4">
        <PageHeader
          title="Cash Tracking"
          subtitle="Monitor staff shifts, cash collection, and financial accountability across the hospital."
          actions={
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          }
        />

        {isLoading && !data ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <StatCard
                title="Total Collection"
                value={formatCurrency(summary.totalCollected)}
                icon={Wallet}
                color="green"
                isLoading={isFetching && !data}
              />
              <StatCard
                title="Total Refunds"
                value={formatCurrency(summary.totalRefunded)}
                icon={RefreshCw}
                color="red"
                isLoading={isFetching && !data}
              />
              <StatCard
                title="Active Shifts"
                value={summary.activeShiftsCount.toString()}
                icon={Search}
                color="purple"
                isLoading={isFetching && !data}
              />
            </div>

            {/* Filters */}
            <div className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 transition-all"
                />
              </div>

              <ShiftStatusFilter
                currentStatus={filters.status}
                onStatusChange={(status) => setFilter("status", status)}
              />

              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilter("startDate", e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                  />
                </div>
                <span className="text-gray-300 font-black">/</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilter("endDate", e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                  />
                </div>
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
                  className="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Shifts Table */}
            <div className="mt-6">
              <ShiftTable
                shifts={shifts}
                isLoading={isFetching && !data}
                onSelectShift={(shift) => setSelectedShiftId(shift.id)}
              />
            </div>
          </>
        )}
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
