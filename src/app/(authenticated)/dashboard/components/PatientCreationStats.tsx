"use client";

import React from "react";
import { UserPlus2, Users, CalendarDays, Clock3 } from "lucide-react";
import type { PatientCreationStat } from "../types";

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <UserPlus2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark truncate">
              Patient Entry by Staff
            </h2>
            <p className="text-xs lg:text-sm text-gray-500 truncate">
              All time, last 30 days, and last 7 days
            </p>
          </div>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100">
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
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 sm:p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="col-span-6 sm:col-span-5 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                  {item.staffName}
                </p>
                <p className="text-[10px] text-gray-500 sm:hidden">
                  Staff ID: {item.staffId}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-2 flex items-center gap-1.5 text-gray-700">
                <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  {item.allTime}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-2 flex items-center gap-1.5 text-gray-700">
                <CalendarDays className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  {item.last30Days}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-3 flex items-center gap-1.5 text-gray-700">
                <Clock3 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  {item.last7Days}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 text-sm">
            No patient creation records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCreationStats;
