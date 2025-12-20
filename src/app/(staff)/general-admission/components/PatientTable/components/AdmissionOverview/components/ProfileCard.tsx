"use client";
import React from "react";
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Activity,
  Building2,
  Calendar,
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
        {/* Avatar - Centered on mobile */}
        <div
          className={cn(
            "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-md mx-auto sm:mx-0",
            isMale ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
          )}
        >
          <User size={40} strokeWidth={2.5} />
        </div>

        {/* Basic Info */}
        <div className="flex-1 space-y-2 w-full">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {patient.patientFullName}
            </h3>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-xs text-gray-600 mt-1.5 font-medium">
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-700">
                  {patient.patientAge ?? "N/A"} Years
                </span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-700">{patient.patientGender}</span>
              </span>

              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-700 font-mono tracking-tight">
                  {patient.patientPhone || "N/A"}
                </span>
              </span>

              {patient.patientBloodGroup && (
                <span className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md border border-red-100 text-red-600 font-bold">
                  <Activity className="w-3 h-3" />
                  {patient.patientBloodGroup}
                </span>
              )}

              <span className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 text-blue-600">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Admitted: {formatDate(patient.dateAdmitted)}
                </span>
              </span>
            </div>
          </div>

          {/* Address / Guardian / Hospital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center sm:items-start md:items-center gap-2 justify-center sm:justify-start text-left">
              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-600">
                {patient.patientAddress || "No address provided"}
              </span>
            </div>

            {patient.guardianName && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  Guardian:{" "}
                  <span className="font-medium text-gray-900">
                    {patient.guardianName}
                  </span>
                  {patient.guardianPhone && (
                    <span className="text-gray-500 ml-1">
                      ({patient.guardianPhone})
                    </span>
                  )}
                </span>
              </div>
            )}

            {patient.hospitalName && (
              <div className="flex items-center gap-2 sm:col-span-2 justify-center sm:justify-start">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  Hospital:{" "}
                  <span className="font-medium text-fnh-blue">
                    {patient.hospitalName}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
