"use client";

import React, { useState, useRef } from "react";
import {
  Clock,
  User,
  Wallet,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Calendar,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useAdminShiftsData,
  DatePreset,
  getDatePresetLabel,
} from "../hooks/useAdminShiftsData";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "lastWeek", label: "Last Week" },
  { value: "lastMonth", label: "Last Month" },
];

interface RecentShiftsProps {
  isLoading?: boolean;
}

/**
 * Recent Shifts Component for Normal Admin Dashboard
 *
 * Shows shifts from employees with date range filter.
 * Only rendered for admin users (not system-admin).
 */
export const RecentShifts: React.FC<RecentShiftsProps> = ({
  isLoading: propsLoading = false,
}) => {
  // State for date filter
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Use the hook to fetch admin shifts
  const { shifts, summary, isLoading, isFetching, isError, refetch } =
    useAdminShiftsData({
      datePreset,
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);
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

  // Take only the first 5 shifts for the dashboard widget
  const recentShifts = shifts.slice(0, 5);

  // Show skeleton during initial load
  if (propsLoading || isLoading) {
    return <RecentShiftsSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 h-full flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400 mb-2 sm:mb-3" />
        <p className="text-xs sm:text-sm font-medium text-gray-600 text-center">
          Unable to load shifts data
        </p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
          Please check your permissions
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-5 h-full hover:shadow-md transition-shadow duration-300 flex flex-col relative">
      {/* Loading overlay when refetching */}
      {isFetching && (
        <div className="absolute inset-0 bg-white/60 rounded-2xl z-10 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-fnh-navy animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-fnh-blue/10 to-fnh-navy/10 rounded-lg sm:rounded-xl">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-fnh-navy" />
          </div>
          <div>
            <h3 className="text-[11px] sm:text-xs lg:text-sm font-bold text-gray-900">
              Staff Shifts
            </h3>
            <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
              {summary.activeShiftsCount} active now
            </p>
          </div>
        </div>
        <Link
          href="/admin/cash-tracking"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] lg:text-xs font-bold text-fnh-blue hover:text-fnh-navy bg-fnh-blue/5 hover:bg-fnh-blue/10 rounded-lg transition-colors group"
        >
          <span>View All</span>
          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Date Filter */}
      <div className="mb-3 sm:mb-4">
        <button
          ref={dateButtonRef}
          onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
          disabled={isFetching}
          className="w-full flex items-center justify-between gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] sm:text-xs font-medium text-fnh-navy-dark transition-colors cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{getDatePresetLabel(datePreset)}</span>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* Date Dropdown Portal */}
      <DropdownPortal
        isOpen={isDateDropdownOpen}
        onClose={() => setIsDateDropdownOpen(false)}
        buttonRef={dateButtonRef}
        className="w-36 sm:w-40"
      >
        <div className="py-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setDatePreset(preset.value);
                setIsDateDropdownOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-[10px] sm:text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                datePreset === preset.value
                  ? "text-fnh-navy bg-fnh-navy/5"
                  : "text-gray-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </DropdownPortal>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-br from-gray-50/80 to-white rounded-lg sm:rounded-xl mb-3 sm:mb-4 border border-gray-100/50">
        <div className="text-center">
          <p className="text-sm sm:text-lg lg:text-xl font-black text-emerald-600">
            {formatCurrency(summary.totalCollected)}
          </p>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
            Collection
          </p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-sm sm:text-lg lg:text-xl font-black text-rose-500">
            {formatCurrency(summary.totalRefunded)}
          </p>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
            Refunds
          </p>
        </div>
      </div>

      {/* Shifts List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-1">
        {recentShifts.length > 0 ? (
          <div className="space-y-1.5 sm:space-y-2">
            {recentShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white flex items-center justify-center text-fnh-navy shadow-sm shrink-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-[10px] sm:text-xs truncate">
                        {shift.staff.fullName}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-gray-400" />
                          <span className="text-[8px] sm:text-[9px] text-gray-500 font-medium">
                            {formatDate(shift.startTime)}
                          </span>
                        </div>
                        {shift.isActive && (
                          <span className="px-1 sm:px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[7px] sm:text-[8px] font-black uppercase rounded tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-emerald-600 text-[10px] sm:text-xs">
                      {formatCurrency(shift.totalCollected)}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-gray-400 font-medium">
                      {shift._count.payments} pmts
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-400">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-30" />
            <p className="text-[10px] sm:text-xs font-medium text-center">
              No shifts for {getDatePresetLabel(datePreset).toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* Footer Link */}
      {recentShifts.length > 0 && (
        <Link
          href="/admin/cash-tracking"
          className="mt-3 sm:mt-4 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-gray-500 hover:text-fnh-navy bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors group"
        >
          <span>See All in Cash Tracking</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
};

/**
 * Skeleton Component for Loading State
 */
const RecentShiftsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-5 h-full flex flex-col animate-pulse min-h-[300px]">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gray-100 rounded-lg sm:rounded-xl" />
          <div>
            <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-100 rounded mb-1" />
            <div className="h-2.5 sm:h-3 w-14 sm:w-16 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-6 sm:h-7 w-16 sm:w-20 bg-gray-100 rounded-lg" />
      </div>

      {/* Filter Skeleton */}
      <div className="h-8 sm:h-9 w-full bg-gray-100 rounded-lg mb-3 sm:mb-4" />

      {/* Summary Skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50/50 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
        <div className="text-center">
          <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-100 rounded mx-auto mb-1" />
          <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="text-center border-l border-gray-100">
          <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-100 rounded mx-auto mb-1" />
          <div className="h-2.5 sm:h-3 w-12 sm:w-16 bg-gray-100 rounded mx-auto" />
        </div>
      </div>

      {/* List Skeleton */}
      <div className="flex-1 space-y-1.5 sm:space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-md sm:rounded-lg" />
                <div>
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-100 rounded mb-1" />
                  <div className="h-2.5 sm:h-3 w-24 sm:w-32 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-100 rounded mb-1" />
                <div className="h-2.5 sm:h-3 w-8 sm:w-12 bg-gray-100 rounded ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentShifts;
