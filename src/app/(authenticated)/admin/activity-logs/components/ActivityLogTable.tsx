"use client";

import React from "react";
import { ActivityLogEntry, getActionColor } from "../types";
import ActivityLogTableSkeleton from "./ActivityLogTableSkeleton";
import {
  Clock,
  User,
  ChevronRight,
  AlertCircle,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";

interface ActivityLogTableProps {
  logs: ActivityLogEntry[];
  isLoading: boolean;
  onSelectLog: (log: ActivityLogEntry) => void;
}

const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  logs,
  isLoading,
  onSelectLog,
}) => {
  // Format: "Jan 4, 03:31 PM" - time with date
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleString("en-BD", {
      day: "numeric",
      timeZone: "Asia/Dhaka",
    });
    const month = date.toLocaleString("en-BD", {
      month: "short",
      timeZone: "Asia/Dhaka",
    });
    const time = date.toLocaleString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });
    // Remove space before AM/PM to prevent wrapping
    return `${month} ${day}, ${time.replace(" ", "")}`;
  };

  // Format: "2026" - just year
  const formatYear = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-BD", {
      year: "numeric",
      timeZone: "Asia/Dhaka",
    });
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-3 h-3" />;
      case "tablet":
        return <Tablet className="w-3 h-3" />;
      default:
        return <Monitor className="w-3 h-3" />;
    }
  };

  if (isLoading && logs.length === 0) {
    return <ActivityLogTableSkeleton />;
  }

  const USER_COL_WIDTH = "w-[180px] min-w-[180px]";

  // Drag to scroll horizontally
  const dragScroll = useHorizontalDragScroll();

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      {/* Subtle overlay when re-fetching */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center animate-pulse" />
      )}

      <div
        ref={dragScroll.ref}
        className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200"
        onMouseDown={dragScroll.onMouseDown}
        onMouseUp={dragScroll.onMouseUp}
        onMouseMove={dragScroll.onMouseMove}
        onMouseLeave={dragScroll.onMouseLeave}
      >
        <table className="w-full text-left border-collapse min-w-[900px] lg:min-w-full">
          <thead>
            <tr className="bg-fnh-navy text-white">
              <th
                className={cn(
                  "px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:sticky sm:left-0 sm:z-20 bg-fnh-navy sm:shadow-[2px_0_5px_rgba(0,0,0,0.1)]",
                  USER_COL_WIDTH
                )}
              >
                User
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap w-[140px]">
                Action
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap w-[120px]">
                Entity
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap w-[160px]">
                Timestamp
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-[50px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const actionColor = getActionColor(log.action);
              return (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  {/* User Column */}
                  <td
                    className={cn(
                      "px-3 py-2.5 sm:px-4 sm:py-3 sm:sticky sm:left-0 sm:z-10 bg-white group-hover:bg-gray-50 transition-colors sm:shadow-[2px_0_5px_rgba(0,0,0,0.02)]",
                      USER_COL_WIDTH
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-fnh-navy/5 flex items-center justify-center text-fnh-navy shrink-0">
                        {log.user?.staff?.photoUrl ? (
                          <img
                            src={log.user.staff.photoUrl}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[10px] sm:text-xs truncate">
                          {log.user?.staff?.fullName ||
                            log.user?.username ||
                            "Unknown"}
                        </p>
                        <p className="text-[8px] sm:text-[9px] text-gray-500 font-medium uppercase tracking-tight">
                          {log.user?.role || "N/A"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider",
                        actionColor.bg,
                        actionColor.text
                      )}
                    >
                      <span>{actionColor.icon}</span>
                      <span className="truncate max-w-[70px]">
                        {log.action}
                      </span>
                    </span>
                  </td>

                  {/* Description Column */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="max-w-[320px]">
                      <p className="text-[10px] sm:text-xs text-gray-700 font-medium">
                        {log.description || "No description"}
                      </p>
                      {log.deviceType && (
                        <div className="flex items-center gap-1 mt-1 text-[9px] sm:text-[10px] text-gray-400">
                          {getDeviceIcon(log.deviceType)}
                          <span>
                            {log.browserName || log.deviceType}
                            {log.osType && ` • ${log.osType}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Entity Column */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    {log.entityType ? (
                      <div className="space-y-0.5">
                        <p className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">
                          {log.entityType}
                        </p>
                        {log.entityId && (
                          <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium">
                            ID: {log.entityId}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-gray-400">
                        —
                      </span>
                    )}
                  </td>

                  {/* Timestamp Column */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-gray-700 whitespace-nowrap">
                        <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400 shrink-0" />
                        {formatDateTime(log.timestamp)}
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium ml-4 sm:ml-4.5">
                        {formatYear(log.timestamp)}
                      </p>
                    </div>
                  </td>

                  {/* Arrow Column */}
                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-fnh-navy transition-colors transform group-hover:translate-x-1" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && !isLoading && (
        <div className="py-20 flex flex-col items-center text-gray-400">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-20" />
          <p className="font-medium text-xs sm:text-sm text-center px-4">
            No activity logs found for the selected filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLogTable;
