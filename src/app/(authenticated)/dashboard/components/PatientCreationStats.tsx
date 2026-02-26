"use client";

import React from "react";
import { UserPlus2, Users, CalendarDays, Clock3 } from "lucide-react";
import type { PatientCreationStat } from "../types";
import { useAuth } from "@/app/AuthContext";

interface PatientCreationStatsProps {
  data: PatientCreationStat[];
  isLoading?: boolean;
}

const RowSkeleton: React.FC = () => (
  <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 sm:p-3 rounded-xl bg-gray-50 animate-pulse">
    <div className="col-span-6 sm:col-span-5 h-3.5 sm:h-4 bg-gray-200 rounded" />
    <div className="col-span-2 sm:col-span-2 h-3.5 sm:h-4 bg-gray-200 rounded" />
    <div className="col-span-2 sm:col-span-2 h-3.5 sm:h-4 bg-gray-200 rounded" />
    <div className="col-span-2 sm:col-span-3 h-3.5 sm:h-4 bg-gray-200 rounded" />
  </div>
);

export const PatientCreationStats: React.FC<PatientCreationStatsProps> = ({
  data,
  isLoading = false,
}) => {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <RowSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  const currentUserStats =
    data.find((item) => Number(item.staffId) === Number(user?.staffId)) ||
    data.find((item) => item.staffName === user?.fullName);

  const myStats: PatientCreationStat = {
    staffId: Number(user?.staffId ?? 0),
    staffName: user?.fullName || "Current User",
    allTime: currentUserStats?.allTime ?? 0,
    last30Days: currentUserStats?.last30Days ?? 0,
    last7Days: currentUserStats?.last7Days ?? 0,
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <UserPlus2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark truncate">
              Your Patient Entry Count
            </h2>
            <p className="text-xs lg:text-sm text-gray-500 truncate">
              All time, last 30 days, and last 7 days
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 px-1 sm:px-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {myStats.staffName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <Users className="w-4 h-4 text-indigo-500 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              All Time
            </p>
            <p className="text-sm font-bold text-gray-800">{myStats.allTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <CalendarDays className="w-4 h-4 text-sky-500 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              30 Days
            </p>
            <p className="text-sm font-bold text-gray-800">
              {myStats.last30Days}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <Clock3 className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              7 Days
            </p>
            <p className="text-sm font-bold text-gray-800">
              {myStats.last7Days}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCreationStats;
