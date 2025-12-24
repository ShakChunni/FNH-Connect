import React from "react";

const ShiftTableSkeleton = () => {
  const STAFF_COL_WIDTH = "w-[200px] min-w-[200px]";

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th
                className={`px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:sticky sm:left-0 sm:z-20 bg-fnh-navy ${STAFF_COL_WIDTH}`}
              >
                Staff Details
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Shift Time
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right">
                System Cash
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right">
                Closing
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right">
                Variance
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">
                Status
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index}>
                <td
                  className={`px-4 py-3 sm:px-6 sm:py-4 sm:sticky sm:left-0 sm:z-10 bg-white ${STAFF_COL_WIDTH}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-24" />
                      <div className="h-2 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-28" />
                    <div className="h-2 bg-gray-100 rounded w-20" />
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                  <div className="space-y-2 ml-auto">
                    <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
                    <div className="h-2 bg-gray-100 rounded w-12 ml-auto" />
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                  <div className="h-4 bg-gray-100 rounded w-14 ml-auto" />
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                  <div className="h-8 bg-gray-100 rounded-lg w-20 sm:w-24 ml-auto" />
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                  <div className="h-6 bg-gray-100 rounded-full w-12 sm:w-16 mx-auto" />
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-100 rounded mx-auto" />
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
