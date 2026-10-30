"use client";
import React from "react";
import {
  CreditCard,
  BadgePercent,
  AlertCircle,
  ShieldCheck,
  Wallet,
  TrendingDown,
  Receipt,
} from "lucide-react";
import { PathologyPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";
import { TONE_BADGE } from "@/lib/statusStyles";

interface FinancialOverviewProps {
  patient: PathologyPatientData;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  patient,
}) => {
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  const stats = [
    {
      label: "Test Charge",
      value: patient.testCharge,
      icon: Receipt,
      bg: "bg-slate-50",
      border: "border-slate-100",
      color: "text-slate-600",
      valueColor: "text-slate-900",
    },
    {
      label: "Discount",
      value: patient.discountAmount || 0,
      icon: BadgePercent,
      bg: "bg-orange-50",
      border: "border-orange-100",
      color: "text-orange-700",
      valueColor: "text-orange-700",
      prefix: patient.discountAmount && patient.discountAmount > 0 ? "-" : "",
    },
    {
      label: "Grand Total",
      value: patient.grandTotal,
      icon: CreditCard,
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      color: "text-indigo-600",
      valueColor: "text-indigo-700",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex p-2 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-100">
          <Wallet size={16} />
        </div>
        <div>
          <h4 className="text-2xs sm:text-xs font-black text-slate-800 uppercase tracking-wide leading-tight">
            Financial Overview
          </h4>
          <p className="hidden sm:block text-2xs font-bold text-slate-500 mt-0.5 uppercase tracking-tight">
            Payment summary & billing
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl border",
              stat.bg,
              stat.border
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <stat.icon size={12} className={stat.color} />
              <p
                className={cn(
                  "text-2xs sm:text-2xs font-bold uppercase tracking-wide",
                  stat.color
                )}
              >
                {stat.label}
              </p>
            </div>
            <p
              className={cn(
                "text-base sm:text-xl font-black tabular-nums",
                stat.valueColor
              )}
            >
              {stat.prefix || ""}
              {formatCurrency(stat.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Payment Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Paid & Due */}
          <div className="flex gap-6 sm:gap-8">
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 text-slate-500">
                <TrendingDown size={10} strokeWidth={2.5} />
                <span className="text-2xs sm:text-2xs font-bold uppercase tracking-tight">
                  Paid
                </span>
              </div>
              <p className="text-sm sm:text-lg font-black text-emerald-700 tabular-nums">
                {formatCurrency(patient.paidAmount)}
              </p>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 text-slate-500">
                <AlertCircle size={10} strokeWidth={2.5} />
                <span className="text-2xs sm:text-2xs font-bold uppercase tracking-tight">
                  Due
                </span>
              </div>
              <p
                className={cn(
                  "text-sm sm:text-lg font-black tabular-nums",
                  patient.dueAmount > 0 ? "text-red-600" : "text-slate-500"
                )}
              >
                {formatCurrency(patient.dueAmount)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl ring-1 ring-inset text-2xs sm:text-xs font-bold transition-colors",
              TONE_BADGE[patient.dueAmount > 0 ? "danger" : "success"]
            )}
          >
            {patient.dueAmount > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Pending
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                Paid
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
