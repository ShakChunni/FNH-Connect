"use client";

import React from "react";
import { Users, Activity, Percent, Microscope } from "lucide-react";
import { useDashboardStore } from "../store";
import type { DashboardStats } from "../types";

interface StatsGridProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

// Softer, more professional color themes
const cardThemes = {
  navy: {
    bg: "bg-linear-to-br from-fnh-navy to-fnh-navy-dark",
    text: "text-white",
    subtitle: "text-white/70",
    iconBg: "bg-white/15",
  },
  emerald: {
    bg: "bg-linear-to-br from-emerald-500 to-emerald-600",
    text: "text-white",
    subtitle: "text-white/80",
    iconBg: "bg-white/15",
  },
  // Softer blue-gray for occupancy
  slate: {
    bg: "bg-linear-to-br from-slate-500 to-slate-600",
    text: "text-white",
    subtitle: "text-white/80",
    iconBg: "bg-white/15",
  },
  // Softer warm tone for pathology
  rose: {
    bg: "bg-linear-to-br from-rose-400 to-rose-500",
    text: "text-white",
    subtitle: "text-white/80",
    iconBg: "bg-white/15",
  },
};

const StatCardSkeleton: React.FC<{ theme: keyof typeof cardThemes }> = ({
  theme,
}) => {
  const colors = cardThemes[theme];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 lg:p-5 ${colors.bg} shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
          <div className="h-8 w-14 bg-white/30 rounded animate-pulse" />
          <div className="h-3 w-24 bg-white/15 rounded animate-pulse" />
        </div>
        <div className={`p-2.5 lg:p-3 rounded-xl ${colors.iconBg}`}>
          <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/30 rounded animate-pulse" />
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
      {/* Total Admitted */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 lg:p-5 ${cardThemes.navy.bg} shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide mb-1">
              Total Admitted
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {stats?.totalActivePatients ?? 0}
            </p>
            <p className="text-xs lg:text-sm text-white/70 font-medium mt-1">
              Currently in hospital
            </p>
          </div>
          <div className="p-2.5 lg:p-3 rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
            <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Discharged */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 lg:p-5 ${cardThemes.emerald.bg} shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide mb-1">
              Discharged
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {isAllTime
                ? stats?.dischargedAllTime ?? 0
                : stats?.dischargedToday ?? 0}
            </p>
            <p className="text-xs lg:text-sm text-white/70 font-medium mt-1">
              {isAllTime ? "Total released" : "Released today"}
            </p>
          </div>
          <div className="p-2.5 lg:p-3 rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
            <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Occupancy - Softer slate color */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 lg:p-5 ${cardThemes.slate.bg} shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide mb-1">
              Occupancy
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {stats?.occupancyRate ?? 0}%
            </p>
            <p className="text-xs lg:text-sm text-white/70 font-medium mt-1">
              Bed utilization
            </p>
          </div>
          <div className="p-2.5 lg:p-3 rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
            <Percent className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Pathology - Softer rose color */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 lg:p-5 ${cardThemes.rose.bg} shadow-lg hover:shadow-xl transition-all duration-300 group`}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-semibold text-white/80 uppercase tracking-wide mb-1">
              Pathology
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {isAllTime
                ? stats?.pathologyDoneAllTime ?? 0
                : stats?.pathologyDoneToday ?? 0}
            </p>
            <p className="text-xs lg:text-sm text-white/70 font-medium mt-1">
              {isAllTime ? "Tests completed" : "Tests done today"}
            </p>
          </div>
          <div className="p-2.5 lg:p-3 rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
            <Microscope className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
