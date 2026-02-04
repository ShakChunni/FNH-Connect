"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import type { ShiftSummary, DepartmentCashBreakdown } from "./types";

interface CashTrackerShiftsProps {
  shifts: ShiftSummary[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "h:mm a");
};

/**
 * Compact shift breakdown showing each shift with status and earnings
 * Only visible when there are multiple shifts or when shift details are needed
 */
export const CashTrackerShifts: React.FC<CashTrackerShiftsProps> = ({
  shifts,
}) => {
  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);

  if (!shifts || shifts.length === 0) {
    return null;
  }

  // Only show this section if there's meaningful data
  const hasMultipleShifts = shifts.length > 1;
  const hasActiveShift = shifts.some((s) => s.isActive);

  // For single shift, just show a compact summary if active
  if (!hasMultipleShifts && !hasActiveShift) {
    return null;
  }

  const toggleExpand = (shiftId: number) => {
    setExpandedShiftId(expandedShiftId === shiftId ? null : shiftId);
  };

  return (
    <div className="mb-3 shrink-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3 h-3 text-gray-400" />
        <p className="text-[10px] sm:text-xs font-semibold text-gray-600">
          {hasMultipleShifts ? `Shifts (${shifts.length})` : "Current Shift"}
        </p>
      </div>

      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
        {shifts.map((shift, index) => {
          const isActive = shift.isActive;
          const isExpanded = expandedShiftId === shift.shiftId;
          const hasBreakdown = shift.departmentBreakdown.length > 0;

          return (
            <div
              key={shift.shiftId}
              className={`rounded-lg border transition-colors ${
                isActive
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              {/* Shift Header */}
              <button
                onClick={() => hasBreakdown && toggleExpand(shift.shiftId)}
                disabled={!hasBreakdown}
                className={`w-full p-2 flex items-center justify-between ${
                  hasBreakdown ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Status Icon */}
                  {isActive ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <Play className="w-3 h-3 text-emerald-600" />
                    </div>
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}

                  {/* Shift Info */}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] sm:text-xs font-medium text-fnh-navy-dark">
                      {isActive
                        ? "Active"
                        : `Shift ${hasMultipleShifts ? shifts.length - index : ""}`}
                    </span>
                    <span className="text-[9px] text-gray-500">
                      {formatTime(shift.startTime)}
                      {shift.endTime && ` - ${formatTime(shift.endTime)}`}
                    </span>
                  </div>
                </div>

                {/* Amount & Expand */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs font-bold text-fnh-navy-dark">
                      BDT {formatCurrency(shift.totalCollected)}
                    </span>
                    <span className="text-[9px] text-gray-400 ml-1">
                      ({shift.transactionCount})
                    </span>
                  </div>
                  {hasBreakdown && (
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded Department Breakdown */}
              {isExpanded && hasBreakdown && (
                <div className="px-2 pb-2 pt-0">
                  <div className="pl-5 border-l-2 border-gray-200 space-y-1">
                    {shift.departmentBreakdown.map((dept) => (
                      <div
                        key={dept.departmentId}
                        className="flex items-center justify-between py-0.5"
                      >
                        <span className="text-[9px] text-gray-600 truncate">
                          {dept.departmentName}
                        </span>
                        <span className="text-[9px] font-medium text-gray-700 shrink-0 ml-2">
                          BDT {formatCurrency(dept.totalCollected)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CashTrackerShifts;
