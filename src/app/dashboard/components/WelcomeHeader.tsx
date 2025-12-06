"use client";

import React from "react";
import { useAuth } from "@/app/AuthContext";
import { Sparkles, Calendar, RefreshCw } from "lucide-react";
import { getRoleDisplayName } from "@/lib/roles";
import { useDashboardStore } from "../store";
import { useNotificationContext } from "@/app/NotificationProvider";

interface WelcomeHeaderProps {
  isLoading?: boolean;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const formatDate = (): string => {
  return new Date().toLocaleDateString("en-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  isLoading = false,
}) => {
  const { user } = useAuth();
  const greeting = getGreeting();
  const date = formatDate();
  const { statsViewMode, toggleStatsViewMode } = useDashboardStore();
  const { showNotification } = useNotificationContext();

  const displayName = user?.firstName || "User";
  const isAllTime = statsViewMode === "allTime";

  const handleToggle = () => {
    toggleStatsViewMode();
    const newMode = statsViewMode === "today" ? "All Time" : "Today";
    showNotification(`Showing ${newMode} statistics`, "info");
  };

  if (isLoading) {
    return (
      <div className="pt-2 sm:pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="h-7 sm:h-8 w-48 sm:w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 sm:h-5 w-36 sm:w-48 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-14 sm:h-16 w-full sm:w-80 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 sm:pt-0">
      <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Greeting and Date */}
        <div className="order-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-2xl font-bold text-fnh-navy-dark tracking-tight">
              {greeting}, <span className="text-fnh-blue">{displayName}</span>
            </h1>
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-xs lg:text-sm">
            <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
            {date}
          </p>
        </div>

        {/* Right: Toggle + Role/Status */}
        <div className="order-2 flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Stats Toggle Button - matches role box height */}
          <button
            onClick={handleToggle}
            className="flex hover:cursor-pointer items-center justify-center gap-2 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-fnh-blue/30 transition-all duration-300 shadow-sm group h-[52px] sm:h-auto"
          >
            <RefreshCw className="w-4 h-4 text-fnh-blue group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-medium text-fnh-navy-dark">
              {isAllTime ? "All Time" : "Today"}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                isAllTime ? "bg-purple-500" : "bg-emerald-500"
              }`}
            />
          </button>

          {/* Role Box */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-linear-to-r from-fnh-navy to-fnh-navy-dark text-white shadow-lg">
            <div>
              <p className="text-[10px] sm:text-xs text-white/70 font-medium">
                Your Role
              </p>
              <p className="text-xs sm:text-sm font-semibold">
                {user?.role ? getRoleDisplayName(user.role) : "Staff"}
              </p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-[10px] sm:text-xs text-white/70 font-medium">
                Status
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs sm:text-sm font-semibold">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
