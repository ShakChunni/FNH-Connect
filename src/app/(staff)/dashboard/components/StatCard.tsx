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

const colorClasses = {
  navy: {
    bg: "bg-linear-to-br from-fnh-navy to-fnh-navy-dark",
    iconBg: "bg-white/15",
    text: "text-white",
    subtitleText: "text-white/80",
  },
  blue: {
    bg: "bg-linear-to-br from-fnh-blue to-fnh-blue-dark",
    iconBg: "bg-white/15",
    text: "text-white",
    subtitleText: "text-white/80",
  },
  green: {
    bg: "bg-linear-to-br from-emerald-500 to-emerald-600",
    iconBg: "bg-white/15",
    text: "text-white",
    subtitleText: "text-white/80",
  },
  yellow: {
    bg: "bg-linear-to-br from-amber-400 to-amber-500",
    iconBg: "bg-white/20",
    text: "text-amber-900",
    subtitleText: "text-amber-800",
  },
  purple: {
    bg: "bg-linear-to-br from-purple-500 to-purple-600",
    iconBg: "bg-white/15",
    text: "text-white",
    subtitleText: "text-white/80",
  },
  red: {
    bg: "bg-linear-to-br from-rose-500 to-rose-600",
    iconBg: "bg-white/15",
    text: "text-white",
    subtitleText: "text-white/80",
  },
};

const StatCardSkeleton: React.FC<{ color: StatCardProps["color"] }> = ({
  color,
}) => {
  const colors = colorClasses[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${colors.bg} shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 sm:h-4 w-20 sm:w-24 bg-white/20 rounded animate-pulse" />
          <div className="h-7 sm:h-8 w-12 sm:w-16 bg-white/30 rounded animate-pulse" />
          <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-white/15 rounded animate-pulse" />
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl ${colors.iconBg}`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/30 rounded animate-pulse" />
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
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 ${colors.bg} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 group`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p
            className={`text-[10px] sm:text-xs font-semibold ${colors.text} opacity-90 uppercase tracking-wide truncate`}
          >
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 sm:h-9 w-24 sm:w-32 bg-white/20 rounded-lg animate-pulse mt-1" />
          ) : (
            <p
              className={`text-2xl sm:text-3xl font-bold ${colors.text} tracking-tight`}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
          {subtitle &&
            (isLoading ? (
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse mt-1" />
            ) : (
              <p
                className={`text-[10px] sm:text-xs ${colors.subtitleText} font-medium truncate`}
              >
                {subtitle}
              </p>
            ))}
        </div>
        <div
          className={`p-2 sm:p-3 rounded-xl ${colors.iconBg} backdrop-blur-sm shrink-0`}
        >
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
