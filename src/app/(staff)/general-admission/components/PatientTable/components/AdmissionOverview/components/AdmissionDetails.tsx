"use client";
import React from "react";
import { Stethoscope, BedDouble, Pill, Activity, FileText } from "lucide-react";
import {
  AdmissionPatientData,
  ADMISSION_STATUS_OPTIONS,
} from "../../../../../types";

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
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      amber: "bg-amber-100 text-amber-700 border-amber-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      green: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" /> Admission Details
      </h4>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColors(
              statusOption?.color || "blue"
            )}`}
          >
            {statusOption?.label || patient.status}
          </span>
        </div>

        {/* Department & Doctor */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-900">
                {patient.departmentName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Doctor</p>
              <p className="text-sm font-medium text-gray-900">
                Dr. {patient.doctorName}
              </p>
              {patient.doctorSpecialization && (
                <p className="text-xs text-gray-500">
                  {patient.doctorSpecialization}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Room & Ward */}
        {(patient.seatNumber || patient.ward) && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {patient.seatNumber && (
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-xs text-gray-500">Room/Seat</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.seatNumber}
                  </p>
                </div>
              </div>
            )}
            {patient.ward && (
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Ward</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.ward}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diagnosis & Treatment */}
        {(patient.diagnosis || patient.treatment) && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {patient.diagnosis && (
              <div className="flex items-start gap-2">
                <Pill className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Diagnosis</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.diagnosis}
                  </p>
                </div>
              </div>
            )}
            {patient.treatment && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-teal-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Treatment</p>
                  <p className="text-sm font-medium text-gray-900">
                    {patient.treatment}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
