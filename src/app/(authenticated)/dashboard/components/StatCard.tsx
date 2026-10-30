"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color: "navy" | "blue" | "green" | "yellow" | "purple" | "red";
  isLoading?: boolean;
}

// Tinted icon tile per colour; the card itself is plain white.
const colorClasses = {
  navy: { iconBg: "bg-fnh-navy/10", iconText: "text-fnh-navy" },
  blue: { iconBg: "bg-blue-50", iconText: "text-blue-700" },
  green: { iconBg: "bg-emerald-50", iconText: "text-emerald-700" },
  yellow: { iconBg: "bg-amber-50", iconText: "text-amber-700" },
  purple: { iconBg: "bg-purple-50", iconText: "text-purple-700" },
  red: { iconBg: "bg-red-50", iconText: "text-red-700" },
};

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

const StatCardSkeleton: React.FC<{ color: StatCardProps["color"] }> = ({
  color,
}) => {
  const colors = colorClasses[color];

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 sm:h-4 w-20 sm:w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-7 sm:h-8 w-12 sm:w-16 rounded bg-slate-200 animate-pulse" />
          <div className="h-2.5 sm:h-3 w-16 sm:w-20 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${colors.iconBg}`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  isLoading = false,
}) => {
  const colors = colorClasses[color];

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-2xs sm:text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 sm:h-9 w-24 sm:w-32 bg-slate-200 rounded-lg animate-pulse mt-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
          {subtitle &&
            (isLoading ? (
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-2xs sm:text-xs text-slate-500 font-medium truncate">
                {subtitle}
              </p>
            ))}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${colors.iconBg}`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.iconText}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
