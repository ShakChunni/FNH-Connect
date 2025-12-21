"use client";
import React from "react";
import { Edit, Stethoscope, Clock, Receipt, FileText } from "lucide-react";
import { InfertilityPatientData } from "../../../../types";
import { ModalShell } from "@/components/ui/ModalShell";
import { ProfileCard } from "./components/ProfileCard";
import { MedicalDetails } from "./components/MedicalDetails";
import { HistorySection } from "./components/HistorySection";
import { HospitalDetails } from "./components/HospitalDetails";
import { useInfertilityActions } from "../../../../stores";

interface PatientOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  patient: InfertilityPatientData | null;
}

const PatientOverview: React.FC<PatientOverviewProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const { openEditModal } = useInfertilityActions();

  if (!patient && !isOpen) return null;
  if (!patient) return null;

  const formatDateWithTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleEdit = () => {
    onClose();
    setTimeout(() => {
      openEditModal(patient);
    }, 100);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[90%] md:max-w-[85%] lg:max-w-[80%] h-[95vh] sm:h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      {/* Header with Case Info */}
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Stethoscope className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Infertility Management Case Overview
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5 font-medium">
              <span className="font-mono bg-indigo-100/50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                CASE-INF-{patient.id}
              </span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Registered: {formatDateWithTime(patient.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:static p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <ProfileCard patient={patient} />

          {/* Layout: Medical Info & History (Left) and Hospital (Right) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              <MedicalDetails patient={patient} />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FileText className="text-indigo-600 w-4 h-4" />
                  Prescribed Medications
                </h4>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <p
                    className={`text-sm leading-relaxed ${
                      patient.medications
                        ? "text-gray-700 font-medium whitespace-pre-wrap"
                        : "text-gray-400 italic"
                    }`}
                  >
                    {patient.medications ||
                      "No active medications recorded for this patient case."}
                  </p>
                </div>
              </div>

              <HistorySection
                medicalHistory={patient.medicalHistory}
                surgicalHistory={patient.surgicalHistory}
                menstrualHistory={patient.menstrualHistory}
                contraceptiveHistory={patient.contraceptiveHistory}
                chiefComplaint={patient.chiefComplaint}
                notes={patient.notes}
              />
            </div>

            <div className="xl:col-span-1">
              <div className="sticky top-0">
                <HospitalDetails patient={patient} />

                {/* Print Receipt Quick Action (Visual placeholder for future enhancement) */}
                {/* <button className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg transition-all active:scale-[0.98] font-bold tracking-tight">
                  <Receipt className="w-5 h-5" />
                  Generate Case Receipt
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t p-5 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0 shadow-sm">
        <button
          onClick={handleEdit}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 text-gray-700 font-bold text-sm rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto"
        >
          <Edit className="w-4 h-4" />
          Edit Case Details
        </button>
        <button
          onClick={onClose}
          className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0 cursor-pointer w-full sm:w-auto"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
};

export default PatientOverview;
