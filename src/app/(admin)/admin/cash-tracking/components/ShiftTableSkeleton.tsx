import React from "react";

const ShiftTableSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                Staff Details
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                Shift Time
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                System Cash
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                Closing
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                Variance
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-24" />
                      <div className="h-2 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-28" />
                    <div className="h-2 bg-gray-100 rounded w-20" />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="space-y-2 ml-auto">
                    <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
                    <div className="h-2 bg-gray-100 rounded w-12 ml-auto" />
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end">
                  <div className="h-4 bg-gray-100 rounded w-14" />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="h-8 bg-gray-100 rounded-lg w-24 ml-auto" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 bg-gray-100 rounded-full w-16" />
                </td>
                <td className="px-6 py-4">
                  <div className="w-5 h-5 bg-gray-100 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftTableSkeleton;
