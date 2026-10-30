"use client";

import React from "react";
import { UserPlus2, Users, CalendarDays, Clock3 } from "lucide-react";
import type { PatientCreationStat } from "../types";
import { useAuth } from "@/app/AuthContext";
import { isAdminRole } from "@/lib/roles";

interface PatientCreationStatsProps {
  data: PatientCreationStat[];
  isLoading?: boolean;
}

const RowSkeleton: React.FC = () => (
  <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 sm:p-3 rounded-xl bg-slate-50 animate-pulse">
    <div className="col-span-6 sm:col-span-5 h-3.5 sm:h-4 bg-slate-200 rounded" />
    <div className="col-span-2 sm:col-span-2 h-3.5 sm:h-4 bg-slate-200 rounded" />
    <div className="col-span-2 sm:col-span-2 h-3.5 sm:h-4 bg-slate-200 rounded" />
    <div className="col-span-2 sm:col-span-3 h-3.5 sm:h-4 bg-slate-200 rounded" />
  </div>
);

export const PatientCreationStats: React.FC<PatientCreationStatsProps> = ({
  data,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const canViewAllStaffStats = !!user?.role && isAdminRole(user.role);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <UserPlus2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark truncate">
              {canViewAllStaffStats
                ? "Patient Entry by Staff"
                : "Your Patient Entry Count"}
            </h2>
            <p className="text-xs lg:text-sm text-slate-500 truncate">
              All time, last 30 days, and last 7 days
            </p>
          </div>
        </div>
      </div>

      {canViewAllStaffStats ? (
        <>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 rounded-lg bg-fnh-navy text-xs font-semibold uppercase tracking-wide text-white">
            <div className="col-span-5">Staff</div>
            <div className="col-span-2">All Time</div>
            <div className="col-span-2">30 Days</div>
            <div className="col-span-3">7 Days</div>
          </div>

          <div className="space-y-2 sm:space-y-2.5 mt-2 sm:mt-3 max-h-[320px] overflow-y-auto pr-1">
            {data.length > 0 ? (
              data.map((item) => (
                <div
                  key={item.staffId}
                  className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 sm:p-3 rounded-xl bg-slate-50"
                >
                  <div className="col-span-6 sm:col-span-5 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                      {item.staffName}
                    </p>
                    <p className="text-2xs text-slate-500 sm:hidden">
                      Staff ID: {item.staffId}
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-2 flex items-center gap-1.5 text-slate-700">
                    <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold tabular-nums">
                      {item.allTime}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-2 flex items-center gap-1.5 text-slate-700">
                    <CalendarDays className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold tabular-nums">
                      {item.last30Days}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 flex items-center gap-1.5 text-slate-700">
                    <Clock3 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold tabular-nums">
                      {item.last7Days}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No patient creation records found.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-3 px-1 sm:px-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {myStats.staffName}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Users className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <p className="text-2xs font-black uppercase tracking-wider text-slate-500">
                  All Time
                </p>
                <p className="text-sm font-bold text-slate-800 tabular-nums">
                  {myStats.allTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CalendarDays className="w-4 h-4 text-sky-500 shrink-0" />
              <div>
                <p className="text-2xs font-black uppercase tracking-wider text-slate-500">
                  30 Days
                </p>
                <p className="text-sm font-bold text-slate-800 tabular-nums">
                  {myStats.last30Days}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Clock3 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-2xs font-black uppercase tracking-wider text-slate-500">
                  7 Days
                </p>
                <p className="text-sm font-bold text-slate-800 tabular-nums">
                  {myStats.last7Days}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientCreationStats;
