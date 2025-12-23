"use client";

import React from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useShiftDetails } from "../hooks/useAdminShifts";
import {
  Wallet,
  Clock,
  User,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
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
  const { data: shift, isLoading } = useShiftDetails(shiftId);

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
      className="w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Wallet}
        title="Shift Detailed Report"
        subtitle={`Detailed financial activity and payment history for staff shift #${shiftId}`}
        onClose={onClose}
        iconColor="indigo"
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-fnh-blue animate-spin" />
          </div>
        ) : shift ? (
          <div className="space-y-8 pb-10">
            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Staff Member
                </p>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />
                  <p className="font-bold text-gray-900">
                    {shift.staff.fullName}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 ml-6">
                  {shift.staff.role}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Shift Duration
                </p>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <p className="font-bold text-gray-900">
                    {formatDate(shift.startTime)}
                  </p>
                </div>
                {shift.endTime && (
                  <p className="text-[10px] text-gray-400 ml-6">
                    To {formatDate(shift.endTime)}
                  </p>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Opening Cash
                </p>
                <p className="text-lg font-black text-gray-900">
                  {formatCurrency(shift.openingCash)}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Final Variance
                </p>
                <div
                  className={cn(
                    "text-lg font-black",
                    shift.variance === 0 ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {formatCurrency(shift.variance)}
                </div>
              </div>
            </div>

            {/* Reconciliation Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h5 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    Session Summary
                  </h5>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                      <span className="text-xs font-medium text-gray-500">
                        Collected Payments
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        +{formatCurrency(shift.totalCollected)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                      <span className="text-xs font-medium text-gray-500">
                        Refunds Issued
                      </span>
                      <span className="text-sm font-bold text-rose-600">
                        -{formatCurrency(shift.totalRefunded)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50 bg-indigo-50/30 -mx-2 px-2 rounded-lg">
                      <span className="text-xs font-bold text-indigo-700 font-mono">
                        EXPECTED SYSTEM CASH
                      </span>
                      <span className="text-base font-black text-indigo-700">
                        {formatCurrency(shift.systemCash)}
                      </span>
                    </div>
                  </div>

                  {shift.notes && (
                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">
                        Shift Notes
                      </p>
                      <p className="text-xs text-amber-800 italic leading-relaxed">
                        {shift.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions Log */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-6 py-4 bg-fnh-navy flex items-center justify-between">
                    <h5 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Receipt size={18} />
                      Intricate Detailed Logs
                    </h5>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {shift.cashMovements.length} Movements
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <CashMovementLog movements={shift.cashMovements} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <AlertTriangle size={48} className="mb-4 opacity-20" />
            <p>Could not load shift details.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-8 py-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Close Report
        </button>
      </div>
    </ModalShell>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export default ShiftDetailModal;
