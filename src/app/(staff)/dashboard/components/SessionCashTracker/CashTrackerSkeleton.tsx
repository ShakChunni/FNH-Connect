"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";

/**
 * Skeleton Loading Component for Session Cash Tracker
 * Only animates the values, keeps structure visible
 */
export const CashTrackerSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 h-full flex flex-col">
    {/* Header - Static structure, animated subtitle */}
    <div className="flex items-center justify-between mb-3 shrink-0">
      <div>
        <h2 className="text-sm lg:text-base font-semibold text-fnh-navy-dark">
          Cash Tracker
        </h2>
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1" />
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled
          className="p-1.5 sm:p-2 rounded-lg bg-fnh-navy/5 text-fnh-navy opacity-50"
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          disabled
          className="p-1.5 sm:p-2 rounded-lg bg-gray-100 text-gray-400 opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>

    {/* Filters - Static structure */}
    <div className="flex gap-2 mb-3 shrink-0">
      <button
        disabled
        className="flex-1 flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-400 opacity-70"
      >
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 shrink-0" />
          <span>All Depts</span>
        </div>
      </button>
      <button
        disabled
        className="flex-1 flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-400 opacity-70"
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>Today</span>
        </div>
      </button>
    </div>

    {/* Net Cash Display - Static structure, animated values */}
    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-fnh-navy to-fnh-navy-dark mb-3 relative overflow-hidden shrink-0">
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <p className="text-[10px] sm:text-xs text-white/70 font-medium mb-0.5">
          Net Collection
        </p>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="h-7 w-28 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-14 bg-white/10 rounded animate-pulse mb-0.5" />
        </div>
      </div>
    </div>

    {/* Stats Grid - Static structure, animated values */}
    <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
      <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-100">
        <div className="flex items-center gap-1 mb-0.5">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <p className="text-[9px] sm:text-[10px] font-medium text-emerald-600">
            Collected
          </p>
        </div>
        <div className="h-5 w-20 bg-emerald-200 rounded animate-pulse" />
      </div>

      <div className="p-2.5 sm:p-3 rounded-lg bg-rose-50 border border-rose-100">
        <div className="flex items-center gap-1 mb-0.5">
          <TrendingDown className="w-3 h-3 text-rose-600" />
          <p className="text-[9px] sm:text-[10px] font-medium text-rose-600">
            Refunded
          </p>
        </div>
        <div className="h-5 w-16 bg-rose-200 rounded animate-pulse" />
      </div>
    </div>

    {/* Department Breakdown - Skeleton rows */}
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <Layers className="w-3 h-3 text-gray-400" />
        <p className="text-[10px] sm:text-xs font-semibold text-gray-600">
          By Department
        </p>
      </div>
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CashTrackerSkeleton;
