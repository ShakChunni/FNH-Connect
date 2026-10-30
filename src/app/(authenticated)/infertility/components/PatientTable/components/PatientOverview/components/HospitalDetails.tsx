"use client";
import React from "react";
import {
  Building2,
  UserPlus,
  ClipboardCheck,
  CalendarCheck,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";
import { InfertilityPatientData } from "../../../../../types";
import { formatBDT } from "@/lib/timezone";

interface HospitalDetailsProps {
  patient: InfertilityPatientData;
}

export const HospitalDetails: React.FC<HospitalDetailsProps> = ({
  patient,
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not scheduled";
    return formatBDT(dateStr, "d MMMM yyyy");
  };

  return (
    <div className="space-y-4 sm:space-y-6 shrink-0">
      {/* Hospital Contact Info */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h4 className="text-2xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
          <Building2 className="text-indigo-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Primary Hospital
        </h4>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {patient.hospitalName || "N/A"}
            </p>
            <p className="text-2xs sm:text-2xs font-bold text-indigo-700 uppercase tracking-tight mt-0.5">
              {patient.hospitalType || "Medical Center"}
            </p>
          </div>

          <div className="space-y-2 sm:space-y-2.5 pt-2 border-t border-slate-50">
            <div className="flex items-start gap-2 sm:gap-2.5">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-2xs sm:text-xs text-slate-600 leading-relaxed font-medium">
                {patient.hospitalAddress || "Address not available"}
              </p>
            </div>
            {patient.hospitalPhone && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                <p className="text-2xs sm:text-xs text-slate-600 font-medium font-mono tracking-tight">
                  {patient.hospitalPhone}
                </p>
              </div>
            )}
            {patient.hospitalWebsite && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                <p className="text-2xs sm:text-xs text-indigo-600 font-medium underline truncate">
                  {patient.hospitalWebsite}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referral & Treatment Context */}
      <div className="bg-fnh-navy rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6 text-white">
        <div className="space-y-4 sm:space-y-5">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-200 mb-1 sm:mb-1.5">
              <UserPlus size={12} strokeWidth={2.5} />
              <span className="text-2xs sm:text-2xs font-bold uppercase tracking-wide">
                Referral Source
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold capitalize">
              {patient.referralSource || "Internal"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-200 mb-1 sm:mb-1.5">
              <ClipboardCheck size={12} strokeWidth={2.5} />
              <span className="text-2xs sm:text-2xs font-bold uppercase tracking-wide">
                Treatment Plan
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-white/90">
              {patient.treatmentPlan || "Initial diagnostic phase in progress."}
            </p>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-300 mb-1 sm:mb-1.5 font-bold">
              <CalendarCheck size={12} strokeWidth={3} />
              <span className="text-2xs sm:text-2xs font-bold uppercase tracking-wide">
                Next Appointment
              </span>
            </div>
            <p className="text-sm sm:text-lg font-bold text-white tracking-tight">
              {formatDate(patient.nextAppointment)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
