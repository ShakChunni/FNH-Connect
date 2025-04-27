import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TableHeaderProps {
  requestSort: (key: string) => void;
  getClassNamesFor: (name: string) => string | undefined;
  getSortIcon: (key: string) => JSX.Element | null;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  requestSort,
  getClassNamesFor,
  getSortIcon,
}) => {
  return (
    <thead className="bg-gray-50 sticky top-0 z-30 text-[10px] xs:text-xs sm:text-sm md:text-base">
      <tr>
        <th
          className={`px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-3 text-start font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${getClassNamesFor(
            "timestamp"
          )}`}
          onClick={() => requestSort("timestamp")}
        >
          <div className="flex items-center gap-1">
            <span>Date (MYT)</span> {getSortIcon("timestamp")}
          </div>
        </th>
        <th
          className={`px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-3 text-start font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${getClassNamesFor(
            "action"
          )}`}
          onClick={() => requestSort("action")}
        >
          <div className="flex items-center gap-1">
            <span>Event</span> {getSortIcon("action")}
          </div>
        </th>
        <th
          className={`px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-3 text-start font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${getClassNamesFor(
            "description"
          )}`}
          onClick={() => requestSort("description")}
        >
          <div className="flex items-center gap-1">
            <span>Description</span> {getSortIcon("description")}
          </div>
        </th>
        <th
          className={`px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-3 text-start font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${getClassNamesFor(
            "username"
          )}`}
          onClick={() => requestSort("username")}
        >
          <div className="flex items-center gap-1">
            <span>Actor</span> {getSortIcon("username")}
          </div>
        </th>
        <th
          className={`px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-3 text-start font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${getClassNamesFor(
            "ipAddress"
          )}`}
          onClick={() => requestSort("ipAddress")}
        >
          <div className="flex items-center gap-1">
            <span className="hidden xs:inline">IP Address</span>
            <span className="inline xs:hidden">IP</span>
            {getSortIcon("ipAddress")}
          </div>
        </th>
        <th
          className={`px-1 py-1 xs:px-2 xs:py-1 sm:px-3 sm:py-2 md:px-6 md:py-3 text-start font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${getClassNamesFor(
            "deviceInfo"
          )}`}
          onClick={() => requestSort("deviceInfo")}
        >
          <div className="flex items-center gap-1">
            <span className="hidden xs:inline">Device Info</span>
            <span className="inline xs:hidden">Device</span>
            {getSortIcon("deviceInfo")}
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;
