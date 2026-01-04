"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CashTrackerSummaryProps {
  netCash: number;
  totalCollected: number;
  totalRefunded: number;
  transactionCount: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Summary display showing net cash, collected, and refunded amounts
 */
export const CashTrackerSummary: React.FC<CashTrackerSummaryProps> = ({
  netCash,
  totalCollected,
  totalRefunded,
  transactionCount,
}) => {
  const isPositiveNet = netCash >= 0;

  return (
    <>
      {/* Net Cash Display */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-fnh-navy to-fnh-navy-dark mb-3 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-0.5">
            Net Collection
          </p>
          <div className="flex items-end gap-2 flex-wrap">
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {formatCurrency(netCash)}
            </p>
            <div
              className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5 ${
                isPositiveNet
                  ? "bg-emerald-400/20 text-emerald-300"
                  : "bg-red-400/20 text-red-300"
              }`}
            >
              {isPositiveNet ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              {transactionCount} txns
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
        <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <p className="text-[9px] sm:text-[10px] font-medium text-emerald-600">
              Collected
            </p>
          </div>
          <p className="text-sm sm:text-base font-bold text-emerald-700">
            {formatCurrency(totalCollected)}
          </p>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg bg-rose-50 border border-rose-100">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingDown className="w-3 h-3 text-rose-600" />
            <p className="text-[9px] sm:text-[10px] font-medium text-rose-600">
              Refunded
            </p>
          </div>
          <p className="text-sm sm:text-base font-bold text-rose-700">
            {formatCurrency(totalRefunded)}
          </p>
        </div>
      </div>
    </>
  );
};

export default CashTrackerSummary;
