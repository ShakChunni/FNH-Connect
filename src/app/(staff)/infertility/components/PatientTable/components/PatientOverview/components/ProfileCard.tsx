"use client";
import React from "react";
import {
  User,
  Phone,
  MapPin,
  Heart,
  Mail,
  Calendar,
  Briefcase,
  Droplets,
} from "lucide-react";
import { InfertilityPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  patient: InfertilityPatientData;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ patient }) => {
  const isMale = patient.patientGender?.toLowerCase() === "male";

  // Calculate spouse age from DOB if not directly available
  const getSpouseAge = () => {
    if (patient.husbandAge) return patient.husbandAge;
    if (patient.husbandDOB) {
      const dob = new Date(patient.husbandDOB);
      const diff = Date.now() - dob.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }
    return null;
  };

  const spouseAge = getSpouseAge();

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
        {/* === PATIENT SECTION (Priority - Larger) === */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Header: Avatar + Name + Tags */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
            {/* Avatar - centered on mobile */}
            <div className="relative shrink-0">
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
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-md shadow-sm border border-gray-100">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    patient.status?.toLowerCase() === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  )}
                />
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
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-red-50 rounded-md text-[10px] sm:text-xs font-bold text-red-600">
                  <Droplets className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {patient.bloodGroup || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
            <InfoRow icon={Phone} label={patient.mobileNumber || "No phone"} />
            <InfoRow icon={Mail} label={patient.email || "No email"} />
            <InfoRow
              icon={Briefcase}
              label={patient.patientOccupation || "Not specified"}
            />
            <InfoRow
              icon={MapPin}
              label={patient.address || "No address"}
              variant="success"
            />
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-gray-100" />
        <div className="lg:hidden h-px bg-gray-100" />

        {/* === SPOUSE SECTION (Secondary - Narrower) === */}
        <div className="lg:w-64 xl:w-72 p-4 sm:p-6 bg-slate-50/50">
          {/* Header: Icon + Label */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <Heart size={18} className="text-rose-500 fill-rose-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Spouse / Partner
              </span>
              <h4 className="text-base font-bold text-gray-800 leading-tight truncate">
                {patient.husbandName || "Not Recorded"}
              </h4>
            </div>
          </div>

          {/* Spouse Info - Matching Patient Layout */}
          <div className="space-y-2.5">
            {/* Age + Gender Row */}
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg text-xs font-semibold text-gray-600 border border-gray-100 flex-1">
                <Calendar size={12} className="text-gray-400" />
                {spouseAge ? `${spouseAge} Years` : "Age N/A"}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-bold border",
                  isMale
                    ? "bg-pink-50 text-pink-600 border-pink-100"
                    : "bg-blue-50 text-blue-600 border-blue-100"
                )}
              >
                {isMale ? "Female" : "Male"}
              </span>
            </div>

            {/* Occupation */}
            <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-gray-100">
              <Briefcase size={14} className="text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-600 truncate">
                {patient.husbandOccupation || "Not specified"}
              </span>
            </div>

            {/* Marriage Duration Card */}
            <div className="bg-linear-to-r from-rose-50 to-pink-50 rounded-lg p-2.5 sm:p-3 border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Heart size={16} className="text-rose-500 fill-rose-500" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">
                    Marriage Duration
                  </span>
                  <span className="text-base font-bold text-rose-700">
                    {patient.yearsMarried
                      ? `${patient.yearsMarried} ${
                          patient.yearsMarried === 1 ? "Year" : "Years"
                        }`
                      : "Not Specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Spouse Contact (if available) */}
            {patient.husbandPhone && (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-gray-100">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm font-mono font-medium text-gray-600">
                  {patient.husbandPhone}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
