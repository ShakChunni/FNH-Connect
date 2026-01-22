"use client";

import React from "react";
import {
  Clock,
  User,
  MapPin,
  ArrowUpRight,
  Microscope,
  Building2,
} from "lucide-react";
import type { RecentPatient } from "../types";

interface RecentPatientsProps {
  patients: RecentPatient[];
  isLoading?: boolean;
}

const statusConfig = {
  admitted: {
    label: "Admitted",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    dotColor: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    dotColor: "bg-amber-500",
  },
  discharged: {
    label: "Discharged",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    dotColor: "bg-gray-400",
  },
};

const departmentIcons: Record<string, React.ElementType> = {
  pathology: Microscope,
  general: Building2,
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return date.toLocaleDateString("en-BD", { month: "short", day: "numeric" });
  }
};

const PatientRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 animate-pulse">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-3 sm:h-4 w-28 sm:w-32 bg-gray-200 rounded" />
      <div className="h-2 sm:h-3 w-20 sm:w-24 bg-gray-100 rounded" />
    </div>
    <div className="h-5 sm:h-6 w-14 sm:w-16 bg-gray-200 rounded-full" />
  </div>
);

export const RecentPatients: React.FC<RecentPatientsProps> = ({
  patients,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-full">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="space-y-1">
            <div className="h-4 sm:h-5 w-32 sm:w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 sm:h-4 w-24 sm:w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PatientRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 h-full hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark">
            Recent Admissions
          </h2>
          <p className="text-xs lg:text-sm text-gray-500">
            Latest patient activity across all departments
          </p>
        </div>
        <button className="flex items-center gap-1 text-xs sm:text-sm font-medium text-fnh-blue hover:text-fnh-blue-dark transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-blue-50">
          <span className="hidden sm:inline">View all</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {patients.slice(0, 5).map((patient) => {
          const status = statusConfig[patient.status];
          const DeptIcon =
            departmentIcons[patient.departmentType || "general"] || Building2;

          return (
            <div
              key={`${patient.departmentType}-${patient.id}`}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-fnh-navy to-fnh-navy-dark flex items-center justify-center shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-fnh-navy-dark truncate text-sm sm:text-base group-hover:text-fnh-blue transition-colors">
                  {patient.name}
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {formatTimeAgo(patient.admissionDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DeptIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {patient.department}
                  </span>
                  {patient.roomNumber && (
                    <span className="items-center gap-1 hidden sm:flex">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {patient.roomNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${status.bgColor}`}
              >
                <div
                  className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${status.dotColor}`}
                />
                <span
                  className={`text-[10px] sm:text-xs font-medium ${status.textColor}`}
                >
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {patients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-gray-400">
          <User className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-50" />
          <p className="text-xs sm:text-sm font-medium">No recent admissions</p>
          <p className="text-[10px] sm:text-xs">
            Patients will appear here once admitted
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentPatients;
