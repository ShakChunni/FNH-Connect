"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";

export const DateRangeFilter: React.FC = () => {
  const selectedRange = useInfertilityTestFilterStore((state) => state.filters.dateRange);
  const setDateRange = useInfertilityTestFilterStore((state) => state.setDateRange);

  const options = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
  ];

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        <Calendar className="w-3.5 h-3.5" />
        Time Period
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setDateRange(option.value)}
            className={`
              py-2.5 px-3 rounded-xl border text-xs font-medium text-left
              transition-all duration-200
              ${
                selectedRange === option.value
                  ? "border-emerald-600 bg-emerald-600/5 text-emerald-600 shadow-sm"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
