"use client";

import React from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import type { CashFlowSession } from "../types";

interface CashFlowTrackerProps {
  session: CashFlowSession | null;
  isLoading?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const CashFlowSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-full animate-pulse">
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <div className="space-y-1">
        <div className="h-4 sm:h-5 w-28 sm:w-32 bg-gray-200 rounded" />
        <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-100 rounded" />
      </div>
      <div className="h-8 sm:h-10 w-8 sm:w-10 bg-gray-200 rounded-xl" />
    </div>

    <div className="space-y-3 sm:space-y-4">
      <div className="p-3 sm:p-4 rounded-xl bg-gray-50">
        <div className="h-6 sm:h-8 w-24 sm:w-28 bg-gray-200 rounded mb-2" />
        <div className="h-3 sm:h-4 w-16 sm:w-20 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-2.5 sm:p-3 rounded-xl bg-gray-50">
            <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded mb-1" />
            <div className="h-4 sm:h-5 w-10 sm:w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CashFlowTracker: React.FC<CashFlowTrackerProps> = ({
  session,
  isLoading = false,
}) => {
  if (isLoading) {
    return <CashFlowSkeleton />;
  }

  if (!session) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark">
              Session Cash
            </h2>
            <p className="text-xs lg:text-sm text-gray-500">
              Cash flow tracker
            </p>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-gray-100">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-gray-400">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-50" />
          <p className="text-xs sm:text-sm font-medium">No Active Shift</p>
          <p className="text-[10px] sm:text-xs text-center mt-1">
            Start a shift to begin tracking cash flow
          </p>
        </div>
      </div>
    );
  }

  const netCash = session.currentCash - session.openingCash;
  const isPositive = netCash >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-full hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark">
            Session Cash
          </h2>
          <p className="text-xs lg:text-sm text-gray-500">
            {session.staffName}'s shift
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.isActive && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium text-emerald-700">
                Active
              </span>
            </div>
          )}
          <button className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-fnh-navy">
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Current Cash Display */}
      <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-fnh-navy to-fnh-navy-dark mb-4 sm:mb-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <p className="text-xs sm:text-sm text-white/70 font-medium mb-1">
            Current Cash
          </p>
          <div className="flex items-end gap-2 sm:gap-3 flex-wrap">
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {formatCurrency(session.currentCash)}
            </p>
            <div
              className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg mb-1 ${
                isPositive
                  ? "bg-emerald-400/20 text-emerald-300"
                  : "bg-red-400/20 text-red-300"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              {formatCurrency(Math.abs(netCash))}
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-white/50 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            Started at {formatTime(session.startTime)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <p className="text-[10px] sm:text-xs font-medium text-emerald-600">
              Collected
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-700">
            {formatCurrency(session.totalCollected)}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-100">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            <p className="text-[10px] sm:text-xs font-medium text-rose-600">
              Refunded
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-rose-700">
            {formatCurrency(session.totalRefunded)}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-fnh-blue" />
            <p className="text-[10px] sm:text-xs font-medium text-fnh-blue">
              Payments
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-fnh-blue-dark">
            {session.paymentsCount}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            <p className="text-[10px] sm:text-xs font-medium text-amber-600">
              Opening
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-amber-700">
            {formatCurrency(session.openingCash)}
          </p>
        </div>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50">
        <div>
          <p className="text-xs sm:text-sm font-medium text-fnh-navy-dark">
            Session Summary
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
            Net {isPositive ? "gain" : "loss"} this shift
          </p>
        </div>
        <div className="relative w-12 h-12 sm:w-16 sm:h-16">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 36 36"
          >
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth="3"
              strokeDasharray={`${Math.min(
                (session.totalCollected / 50000) * 88,
                88
              )} 88`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-[10px] sm:text-xs font-bold ${
                isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {Math.round((session.totalCollected / 50000) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowTracker;
