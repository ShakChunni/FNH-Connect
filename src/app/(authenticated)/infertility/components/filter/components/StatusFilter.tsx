"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useInfertilityTestFilterStore, InfertilityTestStatus } from "../../../stores/testFilterStore";
import { TONE_DOT, type StatusTone } from "@/lib/statusStyles";

export const StatusFilter: React.FC = () => {
  const status = useInfertilityTestFilterStore((state) => state.filters.status);
  const setStatus = useInfertilityTestFilterStore((state) => state.setStatus);

  const options: { label: string; value: InfertilityTestStatus; tone: StatusTone }[] = [
    { label: "All Records", value: "All", tone: "neutral" },
    { label: "Completed", value: "Completed", tone: "success" },
    { label: "Pending", value: "Pending", tone: "warning" },
  ];

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Investigation Status
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = status === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              aria-pressed={isSelected}
              className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[option.tone]}`}
              />
              <span className="text-xs font-bold">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
