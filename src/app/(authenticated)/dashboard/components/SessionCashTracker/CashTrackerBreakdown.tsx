"use client";

import React from "react";
import { Layers, Wallet } from "lucide-react";
import type { DepartmentCashBreakdown } from "./types";

interface CashTrackerBreakdownProps {
  departmentBreakdown: DepartmentCashBreakdown[];
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
 * Department breakdown list showing cash collected per department
 */
export const CashTrackerBreakdown: React.FC<CashTrackerBreakdownProps> = ({
  departmentBreakdown,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <Layers className="w-3 h-3 text-gray-400" />
        <p className="text-[10px] sm:text-xs font-semibold text-gray-600">
          By Department
        </p>
      </div>
      <div className="space-y-1.5 max-h-[120px] sm:max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
        {departmentBreakdown.length > 0 ? (
          departmentBreakdown.map((dept) => (
            <div
              key={dept.departmentId}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-fnh-navy shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 truncate">
                  {dept.departmentName}
                </span>
                <span className="text-[9px] text-gray-400 shrink-0">
                  ({dept.transactionCount})
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-fnh-navy-dark shrink-0">
                {formatCurrency(dept.totalCollected)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-gray-400">
            <Wallet className="w-6 h-6 mb-1 opacity-50" />
            <p className="text-xs">No transactions found</p>
            <p className="text-[10px]">for selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashTrackerBreakdown;
