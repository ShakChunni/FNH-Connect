"use client";
import React from "react";
import {
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Droplets,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { AdmissionPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  patient: AdmissionPatientData;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ patient }) => {
  const isMale = patient.patientGender?.toLowerCase() === "male";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Shared info row component for consistency
  const InfoRow = ({
    icon: Icon,
    label,
    variant = "default",
  }: {
    icon: React.ElementType;
    label: string;
    variant?: "default" | "success" | "primary";
  }) => {
    const variantStyles = {
      default: "bg-slate-50 text-gray-700",
      success: "bg-emerald-50 text-emerald-700",
      primary: "bg-indigo-50 text-indigo-700",
    };

    const iconStyles = {
      default: "text-gray-400",
      success: "text-emerald-500",
      primary: "text-indigo-500",
    };

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg",
          variantStyles[variant]
        )}
      >
        <Icon size={12} className={cn("shrink-0", iconStyles[variant])} />
        <span className="text-xs sm:text-sm font-medium truncate">
          {label || "N/A"}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* === PATIENT SECTION === */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          {/* Header: Avatar + Name + Tags */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Avatar - centered on mobile */}
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div
                className={cn(
                  "w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center",
                  isMale
                    ? "bg-blue-50 text-blue-500 border-2 border-blue-100"
                    : "bg-pink-50 text-pink-500 border-2 border-pink-100"
                )}
              >
                <User className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2} />
              </div>
            </div>

            {/* Name + Info Tags */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2 truncate">
                {patient.patientFullName}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 rounded-md text-[10px] sm:text-xs font-semibold text-gray-600">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {patient.patientAge ?? "N/A"} Yrs
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold",
                    isMale
                      ? "bg-blue-50 text-blue-600"
                      : "bg-pink-50 text-pink-600"
                  )}
                >
                  {patient.patientGender}
                </span>
                {patient.patientBloodGroup && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-red-50 rounded-md text-[10px] sm:text-xs font-bold text-red-600">
                    <Droplets className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {patient.patientBloodGroup}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md text-[10px] sm:text-xs font-semibold text-blue-600 border border-blue-100/50">
                  <Calendar className="w-2.5 h-2.5" />
                  Admitted: {formatDate(patient.dateAdmitted)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
            <InfoRow icon={Phone} label={patient.patientPhone || "No phone"} />
            <InfoRow icon={Mail} label={patient.patientEmail || "No email"} />
            <InfoRow
              icon={MapPin}
              label={patient.patientAddress || "No address"}
              variant="success"
            />
            {patient.guardianName && (
              <InfoRow
                icon={ShieldCheck}
                label={`Guardian: ${patient.guardianName}${
                  patient.guardianPhone ? ` (${patient.guardianPhone})` : ""
                }`}
              />
            )}

            {/* Attending Doctor moved here to fill gap on the left */}
            {patient.doctorName && (
              <div className="sm:col-span-2 mt-1">
                <div className="bg-linear-to-r from-purple-50/80 to-indigo-50/80 rounded-xl p-2.5 sm:p-3 border border-purple-100/50 flex items-center justify-between group hover:border-purple-200 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[9px] font-bold text-purple-600 uppercase tracking-widest mb-0.5">
                      Attending Physician
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-indigo-900 leading-none">
                      {patient.doctorName}
                    </span>
                    {patient.doctorSpecialization && (
                      <span className="text-[10px] sm:text-xs text-indigo-500/80 font-medium mt-1">
                        {patient.doctorSpecialization}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100/50 flex items-center justify-center text-indigo-600 ring-4 ring-white shadow-sm">
                    <User size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-gray-100" />
        <div className="lg:hidden h-px bg-gray-100" />

        {/* === HOSPITAL SECTION === */}
        <div className="lg:w-64 xl:w-72 p-4 sm:p-6 bg-slate-50/50 flex flex-col justify-center">
          <div className="space-y-4 sm:space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Referring Hospital
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                  {patient.hospitalName || "Self / Direct"}
                </h4>
              </div>
            </div>

            {/* Hospital Details */}
            {patient.hospitalName && (
              <div className="space-y-1.5 sm:space-y-2">
                {patient.hospitalType && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded-lg border border-gray-100/50">
                    <span className="text-[9px] sm:text-[10px] font-bold text-indigo-500 uppercase tracking-tight">
                      {patient.hospitalType}
                    </span>
                  </div>
                )}

                {patient.hospitalAddress && (
                  <div className="flex items-start gap-2 py-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-500 line-clamp-2">
                      {patient.hospitalAddress}
                    </span>
                  </div>
                )}

                {patient.hospitalPhone && (
                  <div className="flex items-center gap-2 py-0.5">
                    <Phone className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-mono font-medium text-gray-500">
                      {patient.hospitalPhone}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
