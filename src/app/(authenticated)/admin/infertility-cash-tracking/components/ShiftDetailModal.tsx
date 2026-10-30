"use client";

import React from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useInfertilityShiftDetails } from "../hooks";
import {
  Wallet,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CashMovementLog from "./CashMovementLog";

interface ShiftDetailModalProps {
  shiftId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  shiftId,
  isOpen,
  onClose,
}) => {
  const { data: shift, isLoading, refetch } = useInfertilityShiftDetails(shiftId);

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95%] sm:max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Wallet}
        title="HSI Center Shift Report"
        subtitle={`Summary of HSI Center collections for shift #${shiftId}`}
        onClose={onClose}
        iconColor="teal"
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white rounded-2xl border border-slate-200" />
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
          </div>
        ) : shift ? (
          <div className="space-y-6 sm:space-y-8 pb-10">
            {/* Header Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-2xs font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">Staff Member</p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-teal-500 shrink-0" />
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{shift.staff.fullName}</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-2xs font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">Shift Timing</p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-500 shrink-0" />
                  <p className="font-bold text-slate-900 text-xs sm:text-[13px] tabular-nums">{formatDate(shift.startTime)}</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-teal-500">
                <p className="text-2xs font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">Infertility Collection</p>
                <p className="text-base sm:text-lg font-black text-emerald-700 tabular-nums">{formatCurrency(shift.totalCollected)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                  <h5 className="text-2xs sm:text-xs font-black text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-wider">
                    <FileText size={16} className="text-teal-600" />
                    Session Summary
                  </h5>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-2xs sm:text-xs font-medium text-slate-500 uppercase tracking-tight">Department Collection</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700 tabular-nums">+{formatCurrency(shift.totalCollected)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                  <div className="px-5 py-3 sm:px-6 sm:py-4 bg-fnh-navy flex items-center justify-between">
                    <h5 className="text-2xs sm:text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Receipt size={16} />
                      Department Logs
                    </h5>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[500px]">
                    <CashMovementLog movements={shift.cashMovements} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div role="alert" className="h-full flex flex-col items-center justify-center text-center py-20">
            <AlertTriangle size={48} className="mb-4 text-slate-500 opacity-10" />
            <p className="text-sm font-medium text-red-700">Could not load shift details.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 h-9 px-4 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-6 sm:px-8 py-4 sm:py-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-10 w-full sm:w-auto px-6 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
};

export default ShiftDetailModal;
