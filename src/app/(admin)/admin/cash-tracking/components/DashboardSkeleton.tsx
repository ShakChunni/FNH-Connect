import React from "react";

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-100 rounded w-20 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-gray-50" />
    </div>
    <div className="h-3 bg-gray-50 rounded w-24 animate-pulse" />
  </div>
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Filters Skeleton */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex gap-4">
        <div className="flex-1 h-10 bg-gray-50 rounded-xl animate-pulse" />
        <div className="w-40 h-10 bg-gray-50 rounded-xl animate-pulse" />
        <div className="w-80 h-10 bg-gray-50 rounded-xl animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-12 bg-fnh-navy/10 animate-pulse" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-50" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 bg-gray-100 rounded w-1/4" />
                <div className="h-2 bg-gray-50 rounded w-1/6" />
              </div>
              <div className="w-24 h-8 bg-gray-50 rounded-lg mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
