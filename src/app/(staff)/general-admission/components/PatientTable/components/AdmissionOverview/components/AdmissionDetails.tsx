"use client";
import React from "react";
import {
  Stethoscope,
  BedDouble,
  Pill,
  FileText,
  ClipboardList,
  Activity,
  UserCheck,
} from "lucide-react";
import {
  AdmissionPatientData,
  ADMISSION_STATUS_OPTIONS,
} from "../../../../../types";
import { cn } from "@/lib/utils";

interface AdmissionDetailsProps {
  patient: AdmissionPatientData;
}

export const AdmissionDetails: React.FC<AdmissionDetailsProps> = ({
  patient,
}) => {
  const statusOption = ADMISSION_STATUS_OPTIONS.find(
    (o) => o.value === patient.status
  );

  const getStatusColors = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-700",
      amber: "bg-amber-100 text-amber-700",
      purple: "bg-purple-100 text-purple-700",
      green: "bg-emerald-100 text-emerald-700",
      red: "bg-red-100 text-red-700",
    };
    return colors[color] || colors.blue;
  };

  const details = [
    {
      label: "Department",
      value: patient.departmentName,
      icon: Activity,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "Attending Doctor",
      value: `Dr. ${patient.doctorName}`,
      subtitle: patient.doctorSpecialization,
      icon: UserCheck,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
  ];

  const locationDetails = [
    patient.seatNumber && {
      label: "Room/Seat",
      value: patient.seatNumber,
      icon: BedDouble,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    patient.ward && {
      label: "Ward",
      value: patient.ward,
      icon: BedDouble,
      color: "bg-green-50 text-green-600 border-green-100",
    },
  ].filter(Boolean);

  const medicalDetails = [
    patient.diagnosis && {
      label: "Diagnosis",
      value: patient.diagnosis,
      icon: Pill,
      color: "bg-red-50 text-red-600 border-red-100",
    },
    patient.treatment && {
      label: "Treatment",
      value: patient.treatment,
      icon: FileText,
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-white sm:w-4 sm:h-4" />
          <h4 className="text-[11px] sm:text-sm font-bold text-white uppercase tracking-wide">
            Details
          </h4>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold",
            getStatusColors(statusOption?.color || "blue")
          )}
        >
          {statusOption?.label || patient.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
        {/* Department & Doctor */}
        {details.map((item, idx) => (
          <div
            key={idx}
            className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div
              className={cn(
                "p-1.5 sm:p-2 rounded-md sm:rounded-lg border shrink-0 transition-transform group-hover:scale-110",
                item.color
              )}
            >
              <item.icon
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                {item.label}
              </p>
              <p
                className="text-xs sm:text-sm font-bold text-gray-800 truncate"
                title={item.value}
              >
                {item.value}
              </p>
              {item.subtitle && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Location - Room/Ward */}
        {locationDetails.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-2 sm:space-y-3">
            {locationDetails.map((item: any, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={cn(
                    "p-1.5 sm:p-2 rounded-md sm:rounded-lg border shrink-0 transition-transform group-hover:scale-110",
                    item.color
                  )}
                >
                  <item.icon
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                    {item.label}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Medical - Diagnosis/Treatment */}
        {medicalDetails.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-2 sm:space-y-3">
            {medicalDetails.map((item: any, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={cn(
                    "p-1.5 sm:p-2 rounded-md sm:rounded-lg border shrink-0 transition-transform group-hover:scale-110",
                    item.color
                  )}
                >
                  <item.icon
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                    {item.label}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 whitespace-pre-wrap">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
