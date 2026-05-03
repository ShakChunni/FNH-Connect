"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useInfertilityTestFilterStore, InfertilityTestStatus } from "../../../stores/testFilterStore";

export const StatusFilter: React.FC = () => {
  const status = useInfertilityTestFilterStore((state) => state.filters.status);
  const setStatus = useInfertilityTestFilterStore((state) => state.setStatus);

  const options: { label: string; value: InfertilityTestStatus; color: string }[] = [
    { label: "All Records", value: "All", color: "bg-gray-100 text-gray-600" },
    { label: "Completed", value: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "Pending", value: "Pending", color: "bg-amber-50 text-amber-700 border-amber-100" },
  ];

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Investigation Status
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatus(option.value)}
            className={`
              flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border
              transition-all duration-200 cursor-pointer
              ${
                status === option.value
                  ? "border-emerald-600 bg-emerald-600/5 text-emerald-600 shadow-sm"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
              }
            `}
          >
            <span className="text-xs font-bold">{option.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
