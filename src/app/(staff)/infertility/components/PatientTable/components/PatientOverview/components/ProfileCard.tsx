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
        {/* === PATIENT SECTION === */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          {/* Header: Avatar + Name + Tags */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
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

            {/* Attending Consultant moved here to fill gap on the left */}
            <div className="sm:col-span-2 mt-1">
              <div className="bg-linear-to-r from-indigo-50/80 to-blue-50/80 rounded-xl p-2.5 sm:p-3 border border-indigo-100/50 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
                    Attending Consultant
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-900 leading-none">
                    Prof. Dr. Sufia Khatun
                  </span>
                  <span className="text-[10px] sm:text-xs text-indigo-500/80 font-medium mt-1">
                    Gynecology & Infertility Specialist
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100/50 flex items-center justify-center text-indigo-600 ring-4 ring-white shadow-sm">
                  <User size={14} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-gray-100" />
        <div className="lg:hidden h-px bg-gray-100" />

        {/* === SPOUSE SECTION === */}
        <div className="lg:w-64 xl:w-72 p-4 sm:p-6 bg-slate-50/50 flex flex-col justify-center">
          <div className="space-y-4 sm:space-y-5">
            {/* Header: Icon + Label + Name */}
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
                  Spouse / Partner
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight mb-2">
                  {patient.husbandName || "Not Recorded"}
                </h4>

                {/* Spouse Tags: Age + Gender */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-md text-[10px] font-semibold text-gray-600 border border-gray-100 shadow-xs">
                    <Calendar className="w-2.5 h-2.5 text-gray-400" />
                    {spouseAge ? `${spouseAge} yrs` : "N/A"}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-bold border",
                      isMale
                        ? "bg-pink-50 text-pink-600 border-pink-100"
                        : "bg-blue-50 text-blue-600 border-blue-100"
                    )}
                  >
                    {isMale ? "Female" : "Male"}
                  </span>
                </div>
              </div>
            </div>

            {/* Spouse Details Grid (Standardized InfoRows) */}
            <div className="space-y-1.5 pt-1">
              <InfoRow
                icon={Briefcase}
                label={patient.husbandOccupation || "Occupation N/A"}
              />
              {patient.husbandPhone && (
                <InfoRow icon={Phone} label={patient.husbandPhone} />
              )}

              {/* Marriage Duration Card (Standardized like Attending Physician) */}
              <div className="mt-2.5 bg-linear-to-r from-rose-50 to-pink-50 rounded-xl p-2.5 border border-rose-100/50 flex items-center justify-between group hover:border-rose-200 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">
                    Marriage Duration
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-800 leading-none">
                    {patient.yearsMarried
                      ? `${patient.yearsMarried} Years`
                      : "N/A"}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-rose-100/50 flex items-center justify-center text-rose-500 ring-4 ring-white shadow-sm">
                  <Heart size={12} fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
