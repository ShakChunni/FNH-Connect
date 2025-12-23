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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Subtle overlay when re-fetching */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center animate-pulse" />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                Staff Details
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                Shift Time
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                System Cash
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                Closing
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                Variance
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((shift) => (
              <tr
                key={shift.id}
                onClick={() => onSelectShift(shift)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-fnh-navy/5 flex items-center justify-center text-fnh-navy">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {shift.staff.fullName}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        {shift.staff.role}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(shift.startTime)}
                    </div>
                    {shift.endTime ? (
                      <p className="text-[10px] text-gray-400 font-medium ml-5">
                        Ended: {formatDate(shift.endTime)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-500 font-bold ml-5 uppercase">
                        Currently Ongoing
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(shift.systemCash)}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    From {shift._count.payments} payments
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-bold text-indigo-600">
                    {formatCurrency(shift.closingCash || 0)}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-black",
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
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      shift.isActive
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                    )}
                  >
                    {shift.isActive ? "Active" : "Closed"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-fnh-navy transition-colors transform group-hover:translate-x-1" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shifts.length === 0 && !isLoading && (
        <div className="py-20 flex flex-col items-center text-gray-400">
          <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium">
            No shift records found for the selected filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShiftTable;
