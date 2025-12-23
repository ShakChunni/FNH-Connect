"use client";
import React from "react";
import { Edit, Activity, Clock, Printer, X } from "lucide-react";
import { PathologyPatientData } from "../../../../types";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { ProfileCard } from "./components/ProfileCard";
import { FinancialOverview } from "./components/FinancialOverview";
import { TestDetails } from "./components/TestDetails";
import { ClinicalRemarks } from "./components/ClinicalRemarks";
import { usePathologyActions } from "../../../../stores";
import { generatePathologyReceipt } from "../../../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";

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
  const { user } = useAuth();

  if (!patient && !isOpen) return null;
  if (!patient) return null;

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEdit = () => {
    onClose();
    setTimeout(() => {
      openEditModal(patient);
    }, 100);
  };

  const handlePrint = () => {
    generatePathologyReceipt(patient, user?.fullName || "Staff");
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[90%] md:max-w-[85%] lg:max-w-[80%] h-[95vh] sm:h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Activity}
        iconColor="teal"
        title="Pathology Overview"
        subtitle="Complete test details and financial breakdown."
        onClose={onClose}
        extra={
          <div className="flex flex-col items-end gap-0.5 px-3 py-1.5 bg-white/50 border border-slate-200/50 rounded-xl shadow-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Last Updated
            </span>
            <span className="text-xs font-black text-slate-700">
              {formatDateShort(patient.updatedAt)}
            </span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-teal-50 border border-teal-100 rounded-md">
            <span className="text-[8px] sm:text-[9px] font-bold text-teal-400 uppercase">
              Test No
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-teal-700 font-mono">
              {patient.testNumber}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
            <Clock className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-[9px] font-bold text-gray-400 uppercase">
              Test Date
            </span>
            <span className="text-[10px] font-bold text-gray-600">
              {formatDateShort(patient.testDate)}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase ${
              patient.isCompleted
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}
          >
            {patient.isCompleted ? "Done" : "Pending"}
          </div>
        </div>
      </ModalHeader>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-8">
          {/* Profile Section */}
          <ProfileCard patient={patient} />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left Column: Financial & Investigations */}
            <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
              <FinancialOverview patient={patient} />
              <TestDetails variant="investigations" patient={patient} />
            </div>

            {/* Right Column: Metadata & Remarks */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
              <TestDetails variant="info" patient={patient} />
              <ClinicalRemarks remarks={patient.remarks} />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Footer with Print Button */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-b-3xl">
        <div className="flex items-center justify-between gap-2">
          {/* Left Side - Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Receipt</span>
          </button>

          {/* Right Side - Close & Edit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <X className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">Close</span>
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default PatientOverview;
