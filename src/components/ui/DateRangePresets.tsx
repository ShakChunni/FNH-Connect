"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type DateRangePresetValue =
  | "today"
  | "yesterday"
  | "last7days"
  | "thisMonth"
  | "lastMonth"
  | "clear";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePresetsProps {
  onChange: (range: DateRange | undefined) => void;
  activePreset?: DateRangePresetValue | null;
  onActivePresetChange?: (preset: DateRangePresetValue | null) => void;
  disabled?: boolean;
  className?: string;
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PRESETS: { value: DateRangePresetValue; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

export function getPresetDateRange(
  preset: DateRangePresetValue
): DateRange | undefined {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    }
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { from: start, to: today };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: start, to: today };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: start, to: end };
    }
    case "clear":
    default:
      return undefined;
  }
}

export function DateRangePresets({
  onChange,
  activePreset,
  onActivePresetChange,
  disabled = false,
  className,
}: DateRangePresetsProps) {
  const handleSelect = (preset: DateRangePresetValue) => {
    if (disabled) return;

    if (preset === "clear") {
      onChange(undefined);
      onActivePresetChange?.(null);
      return;
    }

    const range = getPresetDateRange(preset);
    onChange(range);
    onActivePresetChange?.(preset);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {PRESETS.map((preset) => {
        const isActive = activePreset === preset.value;
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => handleSelect(preset.value)}
            disabled={disabled}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
              isActive
                ? "bg-fnh-navy text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
            )}
          >
            {preset.label}
          </button>
        );
      })}
      {activePreset && (
        <button
          type="button"
          onClick={() => handleSelect("clear")}
          disabled={disabled}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}
