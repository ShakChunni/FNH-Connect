"use client";
import React from "react";
import { Edit, Activity, Clock } from "lucide-react";
import { PathologyPatientData } from "../../../../types";
import { ModalShell } from "@/components/ui/ModalShell";
import { ProfileCard } from "./components/ProfileCard";
import { FinancialOverview } from "./components/FinancialOverview";
import { TestDetails } from "./components/TestDetails";
import { ClinicalRemarks } from "./components/ClinicalRemarks";
import { usePathologyActions } from "../../../../stores";

interface PatientOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PathologyPatientData | null;
}

const PatientOverview: React.FC<PatientOverviewProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const { openEditModal } = usePathologyActions();

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
    // Small timeout to allow overview close animation to start/finish smoothly
    setTimeout(() => {
      openEditModal(patient);
    }, 100);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      {/* Header with Test Info */}
      <div className="bg-white border-b px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-sm relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5 tracking-tight">
            <Activity className="text-fnh-teal w-6 h-6" />
            Pathology Overview
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
            <span className="font-mono bg-fnh-navy/5 text-fnh-navy px-2.5 py-1 rounded-md font-semibold border border-fnh-navy/10 whitespace-nowrap">
              {patient.testNumber}
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100 font-medium text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {formatDateWithTime(patient.testDate)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:static p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-8 h-8 sm:w-8 sm:h-8"
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

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <ProfileCard patient={patient} />

        {/* Layout: Clinical/Financial (Left) and Details (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FinancialOverview patient={patient} />
            <ClinicalRemarks remarks={patient.remarks} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <TestDetails patient={patient} />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t p-5 flex flex-col-reverse sm:flex-row justify-end gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleEdit}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-fnh-navy hover:text-fnh-navy text-gray-700 font-bold rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto"
        >
          <Edit className="w-4 h-4" />
          Edit Details
        </button>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-fnh-navy hover:bg-fnh-navy-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0 cursor-pointer w-full sm:w-auto"
        >
          Close Overview
        </button>
      </div>
    </ModalShell>
  );
};

export default PatientOverview;
