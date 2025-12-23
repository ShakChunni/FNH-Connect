"use client";

import React from "react";
import { CashMovementDetail } from "../types";
import { TrendingUp, TrendingDown, User, Receipt, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashMovementLogProps {
  movements: CashMovementDetail[];
}

const CashMovementLog: React.FC<CashMovementLogProps> = ({ movements }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (movements.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400">
        <Receipt size={40} className="mb-2 opacity-10" />
        <p className="text-sm font-medium">
          No cash movements recorded in this shift.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {movements.map((movement) => {
        const isCollection =
          movement.movementType === "COLLECTION" ||
          movement.movementType === "PAYMENT_RECEIVED";
        const isRefund = movement.movementType === "REFUND";
        const patient = movement.payment?.patientAccount.patient;

        return (
          <div
            key={movement.id}
            className="p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <div
                  className={cn(
                    "mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                    isCollection
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : isRefund
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  )}
                >
                  {isCollection ? (
                    <TrendingUp size={18} />
                  ) : isRefund ? (
                    <TrendingDown size={18} />
                  ) : (
                    <Receipt size={18} />
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                      {movement.description ||
                        movement.movementType.replace("_", " ")}
                    </p>
                    <span
                      className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border",
                        isCollection
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : isRefund
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      )}
                    >
                      {movement.movementType}
                    </span>
                  </div>

                  {patient && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        <User size={12} className="text-fnh-blue" />
                        <p className="text-xs font-bold text-gray-700">
                          Patient: {patient.fullName}
                        </p>
                      </div>
                      {movement.payment?.receiptNumber && (
                        <div className="flex items-center gap-1.5 grayscale opacity-70">
                          <Receipt size={12} className="text-fnh-navy" />
                          <p className="text-[10px] font-bold text-gray-500">
                            Recpt: {movement.payment.receiptNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium italic">
                    <Clock size={10} />
                    {formatTime(movement.timestamp)}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p
                  className={cn(
                    "text-base font-black font-mono",
                    isCollection
                      ? "text-emerald-600"
                      : isRefund
                      ? "text-rose-600"
                      : "text-gray-900"
                  )}
                >
                  {isCollection ? "+" : isRefund ? "-" : ""}
                  {formatCurrency(movement.amount)}
                </p>
                <p className="text-[9px] font-black text-gray-400 tracking-wider">
                  BDT
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CashMovementLog;
