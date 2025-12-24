"use client";
import React from "react";
import {
  User,
  Activity,
  X,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplets,
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
        "flex flex-col gap-1 p-3 rounded-xl border border-transparent transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm",
        variantStyles[variant]
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={12} className={cn("shrink-0", iconStyles[variant])} />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold truncate px-5">
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
      className="w-full max-w-[90%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] h-fit max-h-[90vh] rounded-3xl overflow-hidden flex flex-col"
    >
      <ModalHeader
        icon={User}
        iconColor={isFemale ? "red" : "blue"}
        title="Patient Profile"
        subtitle="Detailed record of patient and guardian information."
        onClose={onClose}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Patient ID
            </span>
            <span className="text-[11px] font-bold text-gray-700 font-mono">
              #{patient.id.toString().padStart(4, "0")}
            </span>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-md text-[10px] font-bold uppercase border",
              isFemale
                ? "bg-pink-50 text-pink-600 border-pink-100"
                : "bg-blue-50 text-blue-600 border-blue-100"
            )}
          >
            {patient.gender}
          </div>
        </div>
      </ModalHeader>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <div className="flex flex-col sm:flex-row gap-6">
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 mx-auto sm:mx-0",
                  isFemale
                    ? "bg-pink-50 text-pink-500"
                    : "bg-blue-50 text-blue-500"
                )}
              >
                <User size={40} />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                    {patient.fullName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                      <Calendar size={14} className="text-slate-400" />
                      DOB: {formatDate(patient.dateOfBirth)}
                    </div>
                    {patient.bloodGroup && (
                      <div className="flex items-center gap-1.5 text-red-600 font-bold text-sm bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        <Droplets size={14} />
                        {patient.bloodGroup}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {/* Additional Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Residential Details
              </h3>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 min-h-[120px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Current Address
                    </span>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      {patient.address || "No address provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Guardian Information
              </h3>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <User size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                        Guardian Name
                      </span>
                      <p className="text-sm font-bold text-slate-700">
                        {patient.guardianName || "—"}
                      </p>
                    </div>
                  </div>

                  {patient.guardianGender && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="px-3 py-2 bg-slate-50/50 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                          Gender
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {patient.guardianGender}
                        </span>
                      </div>
                      <div className="px-3 py-2 bg-slate-50/50 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                          DOB
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {formatDate(patient.guardianDOB)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-4 sm:px-8 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Audit: Registered on {formatDate(patient.createdAt || "")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Edit size={16} />
            Edit Profile
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default PatientOverview;
