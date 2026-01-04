"use client";

import React from "react";
import { AdminShift } from "../types";
import ShiftTableSkeleton from "./ShiftTableSkeleton";
import { Clock, User, Wallet, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftTableProps {
  shifts: AdminShift[];
  isLoading: boolean;
  onSelectShift: (shift: AdminShift) => void;
}

const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts,
  isLoading,
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
    return <ShiftTableSkeleton />;
  }

  const STAFF_COL_WIDTH = "w-[200px] min-w-[200px]";

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Subtle overlay when re-fetching */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center animate-pulse" />
      )}

      <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th
                className={cn(
                  "px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:sticky sm:left-0 sm:z-20 bg-fnh-navy sm:shadow-[2px_0_5px_rgba(0,0,0,0.1)]",
                  STAFF_COL_WIDTH
                )}
              >
                Staff Details
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Shift Time
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right whitespace-nowrap">
                System Cash
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right whitespace-nowrap">
                Closing
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right whitespace-nowrap">
                Variance
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap text-center">
                Status
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((shift) => (
              <tr
                key={shift.id}
                onClick={() => onSelectShift(shift)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td
                  className={cn(
                    "px-4 py-3 sm:px-6 sm:py-4 sm:sticky sm:left-0 sm:z-10 bg-white group-hover:bg-gray-50 transition-colors sm:shadow-[2px_0_5px_rgba(0,0,0,0.02)]",
                    STAFF_COL_WIDTH
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-fnh-navy/5 flex items-center justify-center text-fnh-navy shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                        {shift.staff.fullName}
                      </p>
                      <p className="text-[9px] sm:text-xs text-gray-500 font-medium uppercase tracking-tight">
                        {shift.staff.role}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="space-y-1 min-w-[140px]">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-gray-700">
                      <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400" />
                      {formatDate(shift.startTime)}
                    </div>
                    {shift.endTime ? (
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium ml-4.5 sm:ml-5">
                        Ended: {formatDate(shift.endTime)}
                      </p>
                    ) : (
                      <p className="text-[9px] sm:text-[10px] text-emerald-500 font-bold ml-4.5 sm:ml-5 uppercase tracking-wider">
                        Currently Ongoing
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">
                    {formatCurrency(shift.systemCash)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
                    {shift._count.payments} payments
                  </p>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                  <p className="font-bold text-fnh-blue text-xs sm:text-sm">
                    {formatCurrency(shift.closingCash || 0)}
                  </p>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[11px] sm:text-xs font-black",
                      shift.variance === 0
                        ? "text-emerald-600 bg-emerald-50"
                        : shift.variance > 0
                        ? "text-blue-600 bg-blue-50"
                        : "text-rose-600 bg-rose-50"
                    )}
                  >
                    {shift.variance > 0 ? "+" : ""}
                    {formatCurrency(shift.variance)}
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border",
                      shift.isActive
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {shift.isActive ? "Active" : "Closed"}
                  </span>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-fnh-navy transition-colors transform group-hover:translate-x-1" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shifts.length === 0 && !isLoading && (
        <div className="py-20 flex flex-col items-center text-gray-400">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-20" />
          <p className="font-medium text-xs sm:text-sm text-center px-4">
            No shift records found for the selected filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShiftTable;
