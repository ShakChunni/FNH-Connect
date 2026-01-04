"use client";

import React from "react";

const ActivityLogTableSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[900px] lg:min-w-full">
          <thead>
            <tr className="bg-fnh-navy">
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-[200px]">
                <div className="h-3 w-16 bg-white/20 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-[140px]">
                <div className="h-3 w-14 bg-white/20 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-[140px]">
                <div className="h-3 w-12 bg-white/20 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-[160px]">
                <div className="h-3 w-18 bg-white/20 rounded animate-pulse" />
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 w-[50px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {/* User Column */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                      <div className="h-2 w-16 bg-gray-50 rounded" />
                    </div>
                  </div>
                </td>
                {/* Action Column */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="h-6 w-20 bg-gray-100 rounded-full" />
                </td>
                {/* Description Column */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="space-y-1.5">
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                    <div className="h-2 w-24 bg-gray-50 rounded" />
                  </div>
                </td>
                {/* Entity Column */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="h-5 w-16 bg-gray-100 rounded" />
                </td>
                {/* Timestamp Column */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-2 w-16 bg-gray-50 rounded" />
                  </div>
                </td>
                {/* Arrow Column */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="h-4 w-4 bg-gray-100 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogTableSkeleton;
