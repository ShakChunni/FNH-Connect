"use client";
import React from "react";
import { Edit, Activity, Clock, Printer, FileText, X } from "lucide-react";
import {
  AdmissionPatientData,
  ADMISSION_STATUS_OPTIONS,
} from "../../../../types";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProfileCard } from "./components/ProfileCard";
import { FinancialOverview } from "./components/FinancialOverview";
import { AdmissionDetails } from "./components/AdmissionDetails";
import { Remarks } from "./components/Remarks";
import {
  generateAdmissionReceipt,
  generateAdmissionInvoice,
} from "../../../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { formatBDT } from "@/lib/timezone";

interface AdmissionOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  patient: AdmissionPatientData | null;
  onEdit?: (patient: AdmissionPatientData) => void;
}

const AdmissionOverview: React.FC<AdmissionOverviewProps> = ({
  isOpen,
  onClose,
  patient,
  onEdit,
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  if (!patient && !isOpen) return null;
  if (!patient) return null;

  const formatDateWithTime = (dateStr: string) => {
    return {
      date: formatBDT(dateStr, "d MMM yyyy"),
      time: formatBDT(dateStr, "hh:mm a"),
    };
  };

  const formatCompactMetadataDateTime = (dateStr: string) => {
    return formatBDT(dateStr, "dd MMM, hh:mm a");
  };

  const handleEdit = () => {
    onClose();
    setTimeout(() => {
      onEdit?.(patient);
    }, 100);
  };

  const handlePrintReceipt = () => {
    generateAdmissionReceipt(patient, user?.fullName || "Staff");
    showNotification("Generating Admission Form...", "success");
  };

  const handlePrintInvoice = () => {
    generateAdmissionInvoice(patient, user?.fullName || "Staff");
    showNotification("Generating Patient Invoice...", "success");
  };

  const statusOption = ADMISSION_STATUS_OPTIONS.find(
    (o) => o.value === patient.status,
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[90%] md:max-w-[85%] lg:max-w-[80%] h-[80vh] sm:h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={Activity}
        iconColor="purple"
        title="Admission Overview"
        subtitle="Complete admission details and billing information."
        onClose={onClose}
        extra={
          <div className="flex flex-col items-end gap-0.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-2xs font-black text-slate-500 uppercase tracking-widest">
              Last Updated
            </span>
            <span className="text-xs font-black text-slate-700">
              {formatCompactMetadataDateTime(patient.updatedAt)}
            </span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-2xs sm:text-2xs font-bold text-slate-500 uppercase">
              Adm No
            </span>
            <span className="text-2xs sm:text-2xs font-bold text-slate-800 font-mono tabular-nums">
              {patient.admissionNumber}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
            <Clock className="w-2.5 h-2.5 text-slate-500" />
            <span className="text-2xs font-bold text-slate-500 uppercase">
              Admitted
            </span>
            <span className="text-2xs font-bold text-slate-600">
              {formatDateWithTime(patient.dateAdmitted).date}
            </span>
            <span className="text-2xs font-medium text-slate-500">
              {formatDateWithTime(patient.dateAdmitted).time}
            </span>
          </div>
          <StatusBadge
            status={patient.status}
            tone={statusOption?.tone}
            label={statusOption?.label || patient.status}
          />
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-50 border border-slate-200 rounded-md min-w-0">
            <span className="text-2xs sm:text-2xs font-bold text-slate-500 uppercase shrink-0">
              Added
            </span>
            <span className="text-2xs sm:text-2xs font-semibold text-slate-700 truncate max-w-[170px]">
              {patient.createdByName || "Unknown"}
            </span>
            <span className="text-2xs sm:text-2xs text-slate-500 truncate max-w-[140px]">
              • {formatCompactMetadataDateTime(patient.createdAt)}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-50 border border-slate-200 rounded-md min-w-0">
            <span className="text-2xs sm:text-2xs font-bold text-slate-500 uppercase shrink-0">
              Edited
            </span>
            <span className="text-2xs sm:text-2xs font-semibold text-slate-700 truncate max-w-[170px]">
              {patient.lastModifiedByName || "Unknown"}
            </span>
            <span className="text-2xs sm:text-2xs text-slate-500 truncate max-w-[140px]">
              • {formatCompactMetadataDateTime(patient.updatedAt)}
            </span>
          </div>
        </div>
      </ModalHeader>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 lg:space-y-8 pb-8">
          {/* Profile Section */}
          <ProfileCard patient={patient} />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Financial & Remarks */}
            <div className="lg:col-span-8 space-y-6 lg:space-y-8">
              <FinancialOverview patient={patient} />
              <Remarks remarks={patient.remarks} />
            </div>

            {/* Right Column: Admission Details */}
            <div className="lg:col-span-4 space-y-6 lg:space-y-8">
              <AdmissionDetails patient={patient} />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Footer with Print Buttons */}
      <div className="border-t border-slate-200 bg-slate-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-b-3xl">
        <div className="flex items-center justify-between gap-2">
          {/* Left Side - Print Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="inline-flex h-9 items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Admission Form</span>
            </button>
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex h-9 items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Patient Invoice</span>
            </button>
          </div>

          {/* Right Side - Close & Edit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium cursor-pointer"
            >
              <X className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">Close</span>
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex h-9 items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer"
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

export default AdmissionOverview;
