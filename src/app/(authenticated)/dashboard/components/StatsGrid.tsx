"use client";

import React from "react";
import { Users, Activity, Percent, Microscope, type LucideIcon } from "lucide-react";
import { useDashboardStore } from "../store";
import type { DashboardStats } from "../types";

interface StatsGridProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

// Tinted icon tiles only; the card itself is plain white.
const cardThemes = {
  navy: { iconBg: "bg-fnh-navy/10", iconText: "text-fnh-navy" },
  emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-700" },
  slate: { iconBg: "bg-slate-100", iconText: "text-slate-600" },
  rose: { iconBg: "bg-rose-50", iconText: "text-rose-700" },
};

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5";

const StatCardSkeleton: React.FC<{ theme: keyof typeof cardThemes }> = ({
  theme,
}) => {
  const colors = cardThemes[theme];
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-14 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 lg:p-3 ${colors.iconBg}`}>
          <div className="h-5 w-5 rounded bg-slate-200 animate-pulse lg:h-6 lg:w-6" />
        </div>
      </div>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: number | string;
  caption: string;
  icon: LucideIcon;
  theme: keyof typeof cardThemes;
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  caption,
  icon: Icon,
  theme,
}) => {
  const colors = cardThemes[theme];
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:text-sm">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums lg:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500 lg:text-sm">
            {caption}
          </p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 lg:p-3 ${colors.iconBg}`}>
          <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${colors.iconText}`} />
        </div>
      </div>
    </div>
  );
};

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  isLoading = false,
}) => {
  const { statsViewMode } = useDashboardStore();
  const isAllTime = statsViewMode === "allTime";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCardSkeleton theme="navy" />
        <StatCardSkeleton theme="emerald" />
        <StatCardSkeleton theme="slate" />
        <StatCardSkeleton theme="rose" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <StatItem
        label="Total Admitted"
        value={stats?.totalActivePatients ?? 0}
        caption="Currently in hospital"
        icon={Users}
        theme="navy"
      />
      <StatItem
        label="Discharged"
        value={
          isAllTime ? (stats?.dischargedAllTime ?? 0) : (stats?.dischargedToday ?? 0)
        }
        caption={isAllTime ? "Total released" : "Released today"}
        icon={Activity}
        theme="emerald"
      />
      <StatItem
        label="Occupancy"
        value={`${stats?.occupancyRate ?? 0}%`}
        caption="Bed utilization"
        icon={Percent}
        theme="slate"
      />
      <StatItem
        label="Pathology"
        value={
          isAllTime ? (stats?.pathologyDoneAllTime ?? 0) : (stats?.pathologyDoneToday ?? 0)
        }
        caption={isAllTime ? "Tests completed" : "Tests done today"}
        icon={Microscope}
        theme="rose"
      />
    </div>
  );
};

export default StatsGrid;
