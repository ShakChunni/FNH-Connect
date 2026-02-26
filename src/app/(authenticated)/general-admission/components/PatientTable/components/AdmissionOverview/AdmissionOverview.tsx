"use client";
import React from "react";
import { Edit, Activity, Clock, Printer, FileText, X } from "lucide-react";
import {
  AdmissionPatientData,
  ADMISSION_STATUS_OPTIONS,
} from "../../../../types";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
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

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateWithTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = date.toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });
    return { date: dateFormatted, time: timeFormatted };
  };

  const formatMetadataDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });
  };

  const formatCompactMetadataDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });
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

  const getStatusBgColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      green: "bg-emerald-50 text-emerald-600 border-emerald-100",
      red: "bg-red-50 text-red-600 border-red-100",
    };
    return colors[color] || colors.blue;
  };

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
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-50 border border-purple-100 rounded-md">
            <span className="text-[8px] sm:text-[9px] font-bold text-purple-400 uppercase">
              Adm No
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 font-mono">
              {patient.admissionNumber}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
            <Clock className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-[9px] font-bold text-gray-400 uppercase">
              Admitted
            </span>
            <span className="text-[10px] font-bold text-gray-600">
              {formatDateWithTime(patient.dateAdmitted).date}
            </span>
            <span className="text-[9px] font-medium text-gray-400">
              {formatDateWithTime(patient.dateAdmitted).time}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase border ${getStatusBgColor(
              statusOption?.color || "blue",
            )}`}
          >
            {statusOption?.label || patient.status}
          </div>
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-50 border border-emerald-100 rounded-md min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase shrink-0">
              Added
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 truncate max-w-[170px]">
              {patient.createdByName || "Unknown"}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-600 truncate max-w-[140px]">
              • {formatCompactMetadataDateTime(patient.createdAt)}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-50 border border-indigo-100 rounded-md min-w-0">
            <span className="text-[8px] sm:text-[9px] font-bold text-indigo-500 uppercase shrink-0">
              Edited
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-700 truncate max-w-[170px]">
              {patient.lastModifiedByName || "Unknown"}
            </span>
            <span className="text-[9px] sm:text-[10px] text-indigo-600 truncate max-w-[140px]">
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
      <div className="border-t border-gray-200 bg-gray-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-b-3xl">
        <div className="flex items-center justify-between gap-2">
          {/* Left Side - Print Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="inline-flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Admission Form</span>
            </button>
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
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
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <X className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">Close</span>
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium cursor-pointer"
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
