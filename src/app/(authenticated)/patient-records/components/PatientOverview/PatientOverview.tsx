"use client";
import React from "react";
import {
  User,
  Activity,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
  UserRoundCog,
} from "lucide-react";
import { PatientData } from "../../types";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn } from "@/lib/utils";

interface PatientOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientData | null;
  onEdit?: (patient: PatientData) => void;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  variant?: "default" | "success" | "primary";
}) => {
  const variantStyles = {
    default: "bg-slate-50 text-gray-700",
    success: "bg-emerald-50 text-emerald-700",
    primary: "bg-indigo-50 text-indigo-700",
  };

  const iconStyles = {
    default: "text-gray-400",
    success: "text-emerald-500",
    primary: "text-indigo-500",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-transparent transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm",
        variantStyles[variant],
      )}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Icon
          size={10}
          className={cn("shrink-0 sm:w-3 sm:h-3", iconStyles[variant])}
        />
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60">
          {label}
        </span>
      </div>
      <span className="text-xs sm:text-sm font-semibold truncate pl-4 sm:pl-5">
        {value || "—"}
      </span>
    </div>
  );
};

const PatientOverview: React.FC<PatientOverviewProps> = ({
  isOpen,
  onClose,
  patient,
  onEdit,
}) => {
  if (!patient) return null;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTimeBDT = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  const isFemale = patient.gender === "Female";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-[55%] xl:max-w-[45%] h-fit max-h-[92vh] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={User}
        iconColor={isFemale ? "red" : "blue"}
        title="Patient Profile"
        subtitle="Patient and guardian information"
        onClose={onClose}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-50 border border-slate-100 rounded-md">
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">
              ID
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 font-mono">
              #{patient.id.toString().padStart(4, "0")}
            </span>
          </div>
          <div
            className={cn(
              "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase border",
              isFemale
                ? "bg-pink-50 text-pink-600 border-pink-100"
                : "bg-blue-50 text-blue-600 border-blue-100",
            )}
          >
            {patient.gender}
          </div>
        </div>
      </ModalHeader>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 sm:p-4 lg:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/50">
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Avatar and Name - Stack on mobile */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                    isFemale
                      ? "bg-pink-50 text-pink-500"
                      : "bg-blue-50 text-blue-500",
                  )}
                >
                  <User className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2 sm:space-y-3 w-full">
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
                      {patient.fullName}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 font-medium text-xs sm:text-sm">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                        <span className="whitespace-nowrap">
                          DOB: {formatDate(patient.dateOfBirth)}
                        </span>
                      </div>
                      {patient.bloodGroup && (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-red-600 font-bold text-xs sm:text-sm bg-red-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-red-100">
                          <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {patient.bloodGroup}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <InfoRow
                  icon={Phone}
                  label="Phone Number"
                  value={patient.phoneNumber}
                />
                <InfoRow
                  icon={Mail}
                  label="Email Address"
                  value={patient.email}
                />
              </div>
            </div>
          </div>

          {/* Additional Details - Stack on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Address Section */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Residential Details
              </h3>
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/50 min-h-[100px] sm:min-h-[130px] h-full">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                      Current Address
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed break-words">
                      {patient.address || "No address provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Section */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Guardian Information
              </h3>
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/50 min-h-[100px] sm:min-h-[130px] h-full">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">
                        Guardian Name
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">
                        {patient.guardianName || "—"}
                      </p>
                    </div>
                  </div>

                  {patient.guardianGender && (
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50/50 rounded-lg">
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                          Gender
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                          {patient.guardianGender}
                        </span>
                      </div>
                      <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50/50 rounded-lg">
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                          DOB
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-600">
                          {formatDate(patient.guardianDOB)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <UserRoundCog className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Record Activity
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Added By
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 break-words">
                  {patient.createdByName || "Unknown"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Last Edited By
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 break-words">
                  {patient.lastEditedByName || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Last Edited At (BDT)
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 break-words">
                  {formatDateTimeBDT(patient.lastEditedAt || patient.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Mobile-first responsive */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4 lg:px-8 lg:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 order-2 sm:order-1">
          <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
            Registered: {formatDateTimeBDT(patient.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2 border border-slate-200 text-slate-600 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default PatientOverview;
