import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonTable: React.FC = () => {
  const rows = Array.from({ length: 10 });

  return (
    <table className="min-w-full bg-white shadow-md rounded-lg">
      <thead className="bg-gray-50 sticky top-0 z-30">
        <tr>
          <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs font-bold text-gray-900 uppercase tracking-wider">
            Date (MYT Time)
          </th>
          <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs font-bold text-gray-900 uppercase tracking-wider">
            Event
          </th>
          <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs font-bold text-gray-900 uppercase tracking-wider">
            Description
          </th>
          <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs font-bold text-gray-900 uppercase tracking-wider">
            Actor
          </th>
          <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs font-bold text-gray-900 uppercase tracking-wider">
            IP Address
          </th>
          <th className="px-3 py-2 md:px-6 md:py-3 text-start text-xs font-bold text-gray-900 uppercase tracking-wider">
            Device Type
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((_, index) => (
          <tr key={index} className="hover:bg-gray-50 border-b">
            <td className="px-3 py-2 md:px-6 md:py-4 text-sm whitespace-nowrap border-r border-gray-100">
              <Skeleton />
            </td>
            <td className="px-3 py-2 md:px-6 md:py-4 text-sm font-bold whitespace-nowrap border-r border-gray-100">
              <Skeleton />
            </td>
            <td className="px-3 py-2 md:px-6 md:py-4 text-sm whitespace-nowrap border-r border-gray-100">
              <Skeleton />
            </td>
            <td className="px-3 py-2 md:px-6 md:py-4 text-sm whitespace-nowrap border-r border-gray-100">
              <Skeleton />
            </td>
            <td className="px-3 py-2 md:px-6 md:py-4 text-sm whitespace-nowrap border-r border-gray-100">
              <Skeleton />
            </td>
            <td className="px-3 py-2 md:px-6 md:py-4 text-sm whitespace-nowrap border-r border-gray-100">
              <Skeleton />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SkeletonTable;
