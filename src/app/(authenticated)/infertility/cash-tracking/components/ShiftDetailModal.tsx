"use client";

import React from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useInfertilityCashTrackingShiftDetails } from "../hooks";
import {
  Wallet,
  Clock,
  User,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftDetailModalProps {
  shiftId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ShiftDetailSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="h-2 w-16 bg-gray-100 rounded mb-3" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-gray-100" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-2 w-12 bg-gray-50 rounded ml-6" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
          <div className="h-3 w-32 bg-gray-200 rounded mb-6" />
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-3">
              <div className="h-2 w-16 bg-gray-100 rounded" />
              <div className="h-2 w-12 bg-gray-100 rounded" />
            </div>
            <div className="flex justify-between border-b pb-3">
              <div className="h-2 w-16 bg-gray-100 rounded" />
              <div className="h-2 w-12 bg-gray-100 rounded" />
            </div>
            <div className="h-10 bg-gray-50 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
          <div className="h-12 bg-fnh-navy/10" />
          <div className="p-6 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 bg-gray-100 rounded" />
                  <div className="h-2 w-1/4 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  shiftId,
  isOpen,
  onClose,
}) => {
  const { data: shift, isLoading } = useInfertilityCashTrackingShiftDetails(
    isOpen ? shiftId : null
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95%] sm:max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Wallet}
        title="HSI Center Shift Report"
        subtitle={`Summary of shift #${shiftId}`}
        onClose={onClose}
        iconColor="indigo"
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <ShiftDetailSkeleton />
        ) : shift ? (
          <div className="space-y-6 sm:space-y-8 pb-10">
            {/* Header Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
                  Staff Member
                </p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-indigo-500 shrink-0" />
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {shift.staff.fullName}
                  </p>
                </div>
                <p className="text-[9px] sm:text-[10px] text-gray-500 ml-5.5 uppercase tracking-tighter">
                  {shift.staff.role}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
                  Shift Timing
                </p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-500 shrink-0" />
                  <p className="font-bold text-gray-900 text-[11px] sm:text-[13px]">
                    {formatDate(shift.startTime)}
                  </p>
                </div>
                {shift.endTime ? (
                  <p className="text-[9px] sm:text-[10px] text-gray-400 ml-5.5">
                    To {formatDate(shift.endTime)}
                  </p>
                ) : (
                  <p className="text-[9px] font-black text-emerald-500 ml-5.5 uppercase">
                    Ongoing
                  </p>
                )}
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
                  Opening Cash
                </p>
                <p className="text-base sm:text-lg font-black text-gray-900">
                  {formatCurrency(shift.openingCash)}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md border-l-4 border-l-indigo-500">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
                  Final Variance
                </p>
                <div
                  className={cn(
                    "text-base sm:text-lg font-black",
                    shift.variance === 0 ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {formatCurrency(shift.variance)}
                </div>
              </div>
            </div>

            {/* Reconciliation Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <h5 className="text-[11px] sm:text-xs font-black text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-wider">
                    <FileText size={16} className="text-indigo-600" />
                    Session Summary
                  </h5>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-tight">
                        Collections
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-600">
                        +{formatCurrency(shift.totalCollected)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-tight">
                        Refunds
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-rose-600">
                        -{formatCurrency(shift.totalRefunded)}
                      </span>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex justify-between items-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                        Expected System Cash
                      </span>
                      <span className="text-sm sm:text-base font-black text-indigo-700">
                        {formatCurrency(shift.systemCash)}
                      </span>
                    </div>
                  </div>

                  {shift.notes && (
                    <div className="mt-6 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangle size={12} className="text-amber-600" />
                        <p className="text-[9px] sm:text-[10px] font-black text-amber-700 uppercase tracking-widest">
                          Shift Notes
                        </p>
                      </div>
                      <p className="text-[11px] sm:text-xs text-amber-800 italic leading-relaxed font-medium">
                        {shift.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions Log */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                  <div className="px-5 py-3 sm:px-6 sm:py-4 bg-fnh-navy flex items-center justify-between">
                    <h5 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Receipt size={16} />
                      Cash Movements
                    </h5>
                    <span className="bg-white/20 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                      {shift.cashMovements.length} Movements
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[500px]">
                    {shift.cashMovements.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No cash movements recorded for this shift.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {shift.cashMovements.map((movement) => (
                          <div
                            key={movement.id}
                            className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-gray-50/50 transition-colors"
                          >
                            <div
                              className={cn(
                                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                                movement.movementType === "PAYMENT_RECEIVED"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : movement.movementType === "REFUND"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-blue-50 text-blue-600"
                              )}
                            >
                              {movement.movementType === "PAYMENT_RECEIVED" ? (
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : movement.movementType === "REFUND" ? (
                                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                                    {movement.movementType
                                      .replace(/_/g, " ")
                                      .toLowerCase()
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </p>
                                  {movement.payment && (
                                    <p className="text-[10px] sm:text-xs text-gray-500">
                                      Receipt {movement.payment.receiptNumber} ·{" "}
                                      {movement.payment.patientAccount.patient.fullName}
                                    </p>
                                  )}
                                  {movement.description && (
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                      {movement.description}
                                    </p>
                                  )}
                                </div>
                                <div className="text-left sm:text-right shrink-0">
                                  <p
                                    className={cn(
                                      "text-sm sm:text-base font-black",
                                      movement.movementType === "REFUND"
                                        ? "text-rose-600"
                                        : "text-emerald-600"
                                    )}
                                  >
                                    {movement.movementType === "REFUND" ? "-" : "+"}
                                    {formatCurrency(Number(movement.amount))}
                                  </p>
                                  <p className="text-[9px] sm:text-[10px] text-gray-400">
                                    {formatDate(movement.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Section */}
            {shift.payments && shift.payments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 sm:px-6 sm:py-4 bg-fnh-navy flex items-center justify-between">
                  <h5 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Stethoscope size={16} />
                    HSI Center Payments
                  </h5>
                  <span className="bg-white/20 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                    {shift.payments.length} Payments
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Receipt
                        </th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Patient
                        </th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Services
                        </th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500 text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {shift.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-xs font-bold text-gray-900">
                            {payment.receiptNumber}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-700">
                            {payment.patientAccount.patient.fullName}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {payment.paymentAllocations
                              .map((a) => a.serviceCharge.serviceName)
                              .join(", ")}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-600 text-right">
                            {formatCurrency(payment.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
            <AlertTriangle size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-medium">Could not load shift details.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-6 sm:px-8 py-4 sm:py-5 flex justify-end">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-colors active:scale-95 cursor-pointer"
        >
          Close Report
        </button>
      </div>
    </ModalShell>
  );
};
