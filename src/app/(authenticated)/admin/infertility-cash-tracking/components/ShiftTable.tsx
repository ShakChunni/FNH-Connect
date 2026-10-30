"use client";

import React from "react";
import { AdminShift } from "../types";
import { Clock, User, AlertCircle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ShiftTableProps {
  shifts: AdminShift[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectShift: (shiftId: number) => void;
}

const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts,
  isLoading,
  isError,
  onRetry,
  onSelectShift,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-BD", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading && shifts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-50 rounded" />
        <div className="h-10 bg-slate-50 rounded" />
        <div className="h-10 bg-slate-50 rounded" />
      </div>
    );
  }

  // A failed load must not read as "no results".
  if (isError && shifts.length === 0) {
    return (
      <div role="alert" className="p-8 text-center">
        <p className="text-sm font-medium text-red-700">
          Could not load HSI Center shifts.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 h-9 px-4 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Staff Details</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide">Shift Time</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-right">Infertility Collection</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-center">Status</th>
              <th className="px-6 py-4 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shifts.map((shift) => (
              <tr
                key={shift.id}
                onClick={() => onSelectShift(shift.id)}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-fnh-navy/5 flex items-center justify-center text-fnh-navy">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{shift.staff.fullName}</p>
                      <p className="text-2xs text-slate-500 font-medium uppercase">{shift.staff.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(shift.startTime)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-bold text-slate-900 text-sm tabular-nums">{formatCurrency(shift.systemCash)}</p>
                  <p className="text-2xs text-slate-500">{(shift as any).infertilityPaymentsCount || 0} collections</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={shift.isActive ? "Active" : "Closed"} />
                </td>
                <td className="px-6 py-4">
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-fnh-navy transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shifts.length === 0 && !isLoading && (
        <div className="py-20 flex flex-col items-center text-slate-500">
          <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium text-sm">No HSI Center shifts recorded.</p>
        </div>
      )}
    </div>
  );
};

export default ShiftTable;
