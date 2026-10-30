"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  User,
  MapPin,
  ArrowUpRight,
  Microscope,
  Building2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { RecentPatient } from "../types";

interface RecentPatientsProps {
  patients: RecentPatient[];
  isLoading?: boolean;
}

// Labels only; tones come from the shared statusStyles via StatusBadge.
const statusLabels: Record<RecentPatient["status"], string> = {
  admitted: "Admitted",
  pending: "Pending",
  discharged: "Discharged",
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
  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 animate-pulse">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200" />
    <div className="flex-1 space-y-2">
      <div className="h-3 sm:h-4 w-28 sm:w-32 bg-slate-200 rounded" />
      <div className="h-2 sm:h-3 w-20 sm:w-24 bg-slate-100 rounded" />
    </div>
    <div className="h-5 sm:h-6 w-14 sm:w-16 bg-slate-200 rounded-full" />
  </div>
);

export const RecentPatients: React.FC<RecentPatientsProps> = ({
  patients,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 h-full">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="space-y-1">
            <div className="h-4 sm:h-5 w-32 sm:w-36 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 sm:h-4 w-24 sm:w-28 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-8 sm:h-9 w-16 sm:w-20 bg-slate-200 rounded-lg animate-pulse" />
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-fnh-navy-dark">
            Recent Admissions
          </h2>
          <p className="text-xs lg:text-sm text-slate-500">
            Latest patient activity across all departments
          </p>
        </div>
        <Link
          href="/patient-records"
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs sm:text-sm font-medium text-fnh-blue transition-colors hover:bg-blue-50 hover:text-fnh-blue-dark"
        >
          View all
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {patients.slice(0, 5).map((patient) => {
          const DeptIcon =
            departmentIcons[patient.departmentType || "general"] || Building2;

          return (
            <div
              key={`${patient.departmentType}-${patient.id}`}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50"
            >
              {/* Avatar */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-fnh-navy flex items-center justify-center shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-fnh-navy-dark truncate text-sm sm:text-base">
                  {patient.name}
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 text-2xs sm:text-xs text-slate-500 mt-0.5 flex-wrap">
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
              <StatusBadge
                status={patient.status}
                label={statusLabels[patient.status]}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>

      {patients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-slate-500">
          <User className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-slate-400" />
          <p className="text-xs sm:text-sm font-medium">No recent admissions</p>
          <p className="text-2xs sm:text-xs">
            Patients will appear here once admitted
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentPatients;
