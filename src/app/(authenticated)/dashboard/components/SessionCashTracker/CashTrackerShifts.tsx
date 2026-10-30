"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ShiftSummary, DepartmentCashBreakdown } from "./types";
import { formatBDT } from "@/lib/timezone";

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
  return formatBDT(dateString, "h:mm a");
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
        <Clock className="w-3 h-3 text-slate-500" />
        <p className="text-2xs sm:text-xs font-semibold text-slate-600">
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
              className={`rounded-lg border ${
                isActive
                  ? "bg-blue-50 border-blue-200"
                  : "bg-slate-50 border-slate-200"
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
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <Play className="w-3 h-3 text-blue-700" />
                    </div>
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}

                  {/* Shift Info */}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-2xs sm:text-xs font-medium text-fnh-navy-dark">
                      {isActive
                        ? "Active"
                        : `Shift ${hasMultipleShifts ? shifts.length - index : ""}`}
                    </span>
                    <span className="text-2xs text-slate-500">
                      {formatTime(shift.startTime)}
                      {shift.endTime && ` - ${formatTime(shift.endTime)}`}
                    </span>
                  </div>
                </div>

                {/* Amount & Expand */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right">
                    <span className="text-2xs sm:text-xs font-bold text-fnh-navy-dark tabular-nums">
                      BDT {formatCurrency(shift.totalCollected - shift.totalRefunded)}
                    </span>
                    {shift.totalRefunded > 0 && (
                      <span className="block text-2xs text-red-700 tabular-nums">
                        -{formatCurrency(shift.totalRefunded)} refund
                      </span>
                    )}
                    <span className="text-2xs text-slate-500 ml-1">
                      ({shift.transactionCount})
                    </span>
                  </div>
                  {hasBreakdown && (
                    <div className="text-slate-500">
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
                  <div className="pl-5 border-l-2 border-slate-200 space-y-1">
                    {shift.departmentBreakdown.map((dept) => (
                      <div
                        key={dept.departmentId}
                        className="flex items-center justify-between py-0.5"
                      >
                        <span className="text-2xs text-slate-600 truncate">
                          {dept.departmentName}
                        </span>
                        <span className="text-2xs font-medium text-slate-700 shrink-0 ml-2 tabular-nums">
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
