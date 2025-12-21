"use client";
import React from "react";
import {
  User,
  Phone,
  MapPin,
  Heart,
  Activity,
  Briefcase,
  Smile,
} from "lucide-react";
import { InfertilityPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  patient: InfertilityPatientData;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ patient }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 flex flex-col lg:flex-row gap-8 items-center lg:items-start text-center lg:text-left">
        {/* Patient Avatar & Basic Info Container */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start w-full lg:w-auto">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-md mx-auto sm:mx-0 bg-indigo-100 text-indigo-600">
            <User size={40} strokeWidth={2.5} />
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {patient.patientFullName}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-600 mt-1.5 font-medium">
                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-gray-700">
                    {patient.patientAge ?? "N/A"} Years /{" "}
                    {patient.patientGender}
                  </span>
                </span>

                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-gray-700 font-mono tracking-tight">
                    {patient.mobileNumber || "N/A"}
                  </span>
                </span>

                {patient.bloodGroup && (
                  <span className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 text-rose-600 font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs pt-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  {patient.address || "No address provided"}
                </span>
              </div>

              {patient.patientOccupation && (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">
                    Occupation:{" "}
                    <span className="text-gray-900 font-medium">
                      {patient.patientOccupation}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider for Desktop */}
        <div className="hidden lg:block w-px h-32 bg-gray-100 mx-2 self-center" />

        {/* Spouse Information */}
        <div className="flex-1 w-full bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-rose-600">
            <Heart className="w-4 h-4 fill-current" />
            <h4 className="text-sm font-bold uppercase tracking-wider">
              Spouse Information
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                  Husband Name
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {patient.husbandName || "N/A"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                  Husband Age
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {patient.husbandAge ? `${patient.husbandAge} Years` : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                  Occupation
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {patient.husbandOccupation || "N/A"}
                </p>
              </div>

              {patient.husbandDOB && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                    Date of Birth
                  </span>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(patient.husbandDOB).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
