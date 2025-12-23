"use client";
import React from "react";
import { Edit, Stethoscope, Clock, FileText, Printer, X } from "lucide-react";
import { InfertilityPatientData } from "../../../../types";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { ProfileCard } from "./components/ProfileCard";
import { MedicalDetails } from "./components/MedicalDetails";
import { HistorySection } from "./components/HistorySection";
import { HospitalDetails } from "./components/HospitalDetails";
import { useInfertilityActions } from "../../../../stores";
import { generateInfertilityReport } from "../../../../utils/generateReport";
import { useAuth } from "@/app/AuthContext";

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
    generateInfertilityReport(patient, user?.fullName || "Staff");
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[90%] md:max-w-[85%] lg:max-w-[80%] h-[95vh] sm:h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Stethoscope}
        iconColor="indigo"
        title="Case Overview"
        subtitle="Comprehensive breakdown of infertility management details."
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
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-indigo-50 border border-indigo-100 rounded-md">
            <span className="text-[8px] sm:text-[9px] font-bold text-indigo-400 uppercase">
              Case ID
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 font-mono">
              #{patient.caseNumber || `INF-${patient.id}`}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
            <Clock className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-[9px] font-bold text-gray-400 uppercase">
              Created
            </span>
            <span className="text-[10px] font-bold text-gray-600">
              {formatDateShort(patient.createdAt)}
            </span>
          </div>
        </div>
      </ModalHeader>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 lg:space-y-8 pb-8">
          {/* Top Section: Profile & Dashboard Overview */}
          <ProfileCard patient={patient} />

          {/* Grid Layout: Organized for Doctors */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left/Main Column: Medical Stats & Qualitative History */}
            <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
              {/* Vitals & Metrics Section */}
              <MedicalDetails patient={patient} />

              {/* Patient History - Now more integrated */}
              <HistorySection
                medicalHistory={patient.medicalHistory}
                surgicalHistory={patient.surgicalHistory}
                menstrualHistory={patient.menstrualHistory}
                contraceptiveHistory={patient.contraceptiveHistory}
                chiefComplaint={patient.chiefComplaint}
                notes={patient.notes}
                lastUpdated={patient.updatedAt}
              />
            </div>

            {/* Right Column: Case Context & Referrals */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
              {/* Treatment & Medications Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Medication & Plan
                  </h4>
                </div>
                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Prescribed Medications
                    </span>
                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 flex-1">
                      <p
                        className={`text-sm leading-relaxed ${
                          patient.medications
                            ? "text-amber-900 font-medium whitespace-pre-wrap"
                            : "text-amber-600/60 italic"
                        }`}
                      >
                        {patient.medications ||
                          "No active medications recorded."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Active Treatment Plan
                    </span>
                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 flex-1">
                      <p
                        className={`text-sm leading-relaxed ${
                          patient.treatmentPlan
                            ? "text-emerald-900 font-medium whitespace-pre-wrap"
                            : "text-emerald-600/60 italic"
                        }`}
                      >
                        {patient.treatmentPlan ||
                          "Initial diagnostic phase in progress."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hospital Context Context */}
              <HospitalDetails patient={patient} />
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
            <span className="hidden sm:inline">Print Report</span>
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
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
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
