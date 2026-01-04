"use client";

import React from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useActivityLogDetails } from "../hooks";
import { getActionColor } from "../types";
import {
  Activity,
  User,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Fingerprint,
  Server,
  AlertTriangle,
  FileText,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLogDetailModalProps {
  logId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="h-2 w-16 bg-gray-100 rounded mb-3" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-gray-100" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-2 w-12 bg-gray-50 rounded ml-6" />
        </div>
      ))}
    </div>

    {/* Device Info Skeleton */}
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
      <div className="h-3 w-32 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-2 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ActivityLogDetailModal: React.FC<ActivityLogDetailModalProps> = ({
  logId,
  isOpen,
  onClose,
}) => {
  const { data: log, isLoading } = useActivityLogDetails(logId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const actionColor = log ? getActionColor(log.action) : null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95%] sm:max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Activity}
        title="Activity Log Details"
        subtitle={log ? `Log #${log.id}` : "Loading..."}
        onClose={onClose}
        iconColor="indigo"
      />

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <DetailSkeleton />
        ) : log ? (
          <div className="space-y-6 pb-10">
            {/* Action Header */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Action Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider self-start",
                    actionColor?.bg,
                    actionColor?.text
                  )}
                >
                  <span className="text-lg">{actionColor?.icon}</span>
                  <span>{log.action}</span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {log.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              )}
            </div>

            {/* User & Entity Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  User Information
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-fnh-navy/5 flex items-center justify-center text-fnh-navy shrink-0">
                    {log.user?.staff?.photoUrl ? (
                      <img
                        src={log.user.staff.photoUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {log.user?.staff?.fullName ||
                        log.user?.username ||
                        "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      @{log.user?.username}
                    </p>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-fnh-blue/10 rounded-full">
                      <span className="text-[10px] font-bold text-fnh-blue uppercase">
                        {log.user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Affected Entity
                </p>
                {log.entityType ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                        {log.entityType}
                      </p>
                    </div>
                    {log.entityId && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Hash className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          ID: {log.entityId}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No entity associated
                  </p>
                )}
              </div>
            </div>

            {/* Device Information */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h5 className="text-[11px] sm:text-xs font-black text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-wider">
                <Monitor className="w-4 h-4 text-indigo-600" />
                Device Information
              </h5>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {/* Device Type */}
                <div>
                  <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                    Device
                  </p>
                  <div className="flex items-center gap-2 text-gray-700">
                    {getDeviceIcon(log.deviceType)}
                    <span className="text-xs sm:text-sm font-bold">
                      {log.deviceType || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Browser */}
                <div>
                  <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                    Browser
                  </p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {log.browserName || "Unknown"}
                      {log.browserVersion && ` ${log.browserVersion}`}
                    </span>
                  </div>
                </div>

                {/* OS */}
                <div>
                  <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                    Operating System
                  </p>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Server className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-bold">
                      {log.osType || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* IP Address */}
                <div>
                  <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                    IP Address
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-bold text-gray-700">
                    {log.ipAddress || "N/A"}
                  </p>
                </div>
              </div>

              {/* Device Fingerprint */}
              {log.readableFingerprint && (
                <div className="mt-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Fingerprint className="w-4 h-4 text-indigo-500" />
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      Device Fingerprint
                    </p>
                  </div>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {log.readableFingerprint}
                  </p>
                </div>
              )}
            </div>

            {/* Session Information */}
            {log.session && (
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 sm:p-6">
                <h5 className="text-[11px] sm:text-xs font-black text-indigo-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Session Information
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-medium text-indigo-600/70 uppercase tracking-wider mb-1">
                      Session ID
                    </p>
                    <p className="text-xs font-mono font-bold text-indigo-800 truncate">
                      {log.session.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-medium text-indigo-600/70 uppercase tracking-wider mb-1">
                      Session Created
                    </p>
                    <p className="text-xs font-bold text-indigo-800">
                      {formatDate(log.session.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
            <AlertTriangle size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-medium">
              Could not load activity log details.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-6 sm:px-8 py-4 sm:py-5 flex justify-end">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-colors active:scale-95 cursor-pointer"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
};

export default ActivityLogDetailModal;
