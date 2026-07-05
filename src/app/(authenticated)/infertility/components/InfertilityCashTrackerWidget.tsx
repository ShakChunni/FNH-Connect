"use client";

import React, { useCallback, useMemo, useState } from "react";
import { RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/app/AuthContext";
import {
  formatCalendarPartsISO,
  getTodayBDTCalendarDateParts,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { useInfertilityCashTrackingShifts } from "../cash-tracking/hooks";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(amount);

export const InfertilityCashTrackerWidget: React.FC = () => {
  const { user } = useAuth();
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const today = useMemo(
    () => formatCalendarPartsISO(getTodayBDTCalendarDateParts()),
    [],
  );

  const filters = useMemo(
    () => ({
      staffId: selectedStaffId,
      startDate: today,
      endDate: today,
      status: "All",
    }),
    [selectedStaffId, today],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useInfertilityCashTrackingShifts(filters);

  const summary = data?.summary ?? {
    totalCollected: 0,
    totalRefunded: 0,
    activeShiftsCount: 0,
  };
  const netCash = summary.totalCollected - summary.totalRefunded;
  const canSelectStaff = data?.canSelectStaff ?? false;
  const staffOptions = data?.filterOptions.staff ?? [];
  const visibleStaffName =
    canSelectStaff && selectedStaffId
      ? staffOptions.find((staff) => staff.id === selectedStaffId)?.fullName ??
        "Selected staff"
      : canSelectStaff
        ? "All staff"
        : user?.fullName ?? "Your shift";

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStaffChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    setSelectedStaffId(nextValue ? Number(nextValue) : null);
  };

  return (
    <section className="w-full sm:w-[360px] rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-emerald-50 bg-emerald-50/70 px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Wallet className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-wider text-emerald-900">
              Today HSI Cash
            </p>
            <p className="truncate text-[11px] font-semibold text-emerald-700">
              {visibleStaffName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Refresh infertility cash tracker"
          title="Refresh"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching ? "animate-spin" : "")}
          />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        {canSelectStaff ? (
          <select
            value={selectedStaffId ?? ""}
            onChange={handleStaffChange}
            disabled={isLoading && !data}
            className="h-9 w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Filter infertility cash by staff"
          >
            <option value="">All staff</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName}
              </option>
            ))}
          </select>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Unable to load infertility cash.
          </div>
        ) : (
          <div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Net Cash
                </p>
                {isLoading && !data ? (
                  <div className="mt-1 h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <p
                    className={cn(
                      "truncate text-2xl font-black",
                      netCash >= 0 ? "text-emerald-700" : "text-rose-600",
                    )}
                    title={formatCurrency(netCash)}
                  >
                    {formatCurrency(netCash)}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 px-2.5 py-2 text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Active
                </p>
                <p className="text-sm font-black text-slate-800">
                  {summary.activeShiftsCount}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-blue-50 bg-blue-50/70 px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                  <TrendingUp className="h-3 w-3" />
                  Collected
                </div>
                <p
                  className="mt-1 truncate text-xs font-black text-blue-900"
                  title={formatCurrency(summary.totalCollected)}
                >
                  {formatCurrency(summary.totalCollected)}
                </p>
              </div>

              <div className="rounded-xl border border-rose-50 bg-rose-50/70 px-2.5 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700">
                  <TrendingDown className="h-3 w-3" />
                  Refunded
                </div>
                <p
                  className="mt-1 truncate text-xs font-black text-rose-900"
                  title={formatCurrency(summary.totalRefunded)}
                >
                  {formatCurrency(summary.totalRefunded)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InfertilityCashTrackerWidget;
