"use client";

import React from "react";
import { AdminShift } from "../types";
import { Clock, User, Wallet, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftTableProps {
  shifts: AdminShift[];
  isLoading: boolean;
  onSelectShift: (shiftId: number) => void;
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
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-50 rounded" />
        <div className="h-10 bg-gray-50 rounded" />
        <div className="h-10 bg-gray-50 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Staff Details</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Shift Time</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Infertility Collection</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((shift) => (
              <tr
                key={shift.id}
                onClick={() => onSelectShift(shift.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-fnh-navy/5 flex items-center justify-center text-fnh-navy">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{shift.staff.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-medium uppercase">{shift.staff.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(shift.startTime)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(shift.systemCash)}</p>
                  <p className="text-[10px] text-gray-500">{(shift as any).infertilityPaymentsCount || 0} collections</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    shift.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"
                  )}>
                    {shift.isActive ? "Active" : "Closed"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-fnh-navy transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shifts.length === 0 && !isLoading && (
        <div className="py-20 flex flex-col items-center text-gray-400">
          <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-medium text-sm">No infertility shifts recorded.</p>
        </div>
      )}
    </div>
  );
};

export default ShiftTable;
