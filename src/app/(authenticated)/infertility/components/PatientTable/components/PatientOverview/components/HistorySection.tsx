"use client";
import React from "react";
import {
  Stethoscope,
  Scissors,
  RefreshCw,
  ShieldAlert,
  FileText,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/timezone";

interface HistorySectionProps {
  medicalHistory: string | null;
  surgicalHistory: string | null;
  menstrualHistory: string | null;
  contraceptiveHistory: string | null;
  chiefComplaint: string | null;
  notes: string | null;
  lastUpdated?: string | null;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  medicalHistory,
  surgicalHistory,
  menstrualHistory,
  contraceptiveHistory,
  chiefComplaint,
  notes,
  lastUpdated,
}) => {
  const formatDateDayMonth = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    const isToday =
      formatBDT(dateStr, "yyyy-MM-dd") === formatBDT(new Date(), "yyyy-MM-dd");
    if (isToday) return "Today";
    return formatBDT(dateStr, "d MMM");
  };
  const sections = [
    {
      label: "Chief Complaint",
      value: chiefComplaint,
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      label: "Medical History",
      value: medicalHistory,
      icon: Stethoscope,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Surgical History",
      value: surgicalHistory,
      icon: Scissors,
      color: "bg-red-50 text-red-600 border-red-100",
    },
    {
      label: "Menstrual History",
      value: menstrualHistory,
      icon: RefreshCw,
      color: "bg-pink-50 text-pink-600 border-pink-100",
    },
    {
      label: "Contraceptive History",
      value: contraceptiveHistory,
      icon: ShieldAlert,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "Clinical Notes",
      value: notes,
      icon: FileText,
      color: "bg-slate-100 text-slate-600 border-slate-200",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
            <ClipboardList size={16} />
          </div>
          <div>
            <h4 className="text-2xs sm:text-xs font-black text-slate-800 uppercase tracking-wide leading-tight">
              Clinical History
            </h4>
            <p className="hidden sm:block text-2xs font-bold text-slate-500 mt-0.5 uppercase tracking-tight">
              Diagnostic & clinical observations
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-white border border-slate-100 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-2xs font-bold text-slate-600">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-100 shadow-sm hover:border-indigo-100 transition duration-200 flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={cn(
                  "p-1.5 sm:p-2 rounded-lg sm:rounded-xl border shrink-0 transition-transform ",
                  section.color
                )}
              >
                <section.icon
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  strokeWidth={2.5}
                />
              </div>
              <h5 className="text-2xs sm:text-2xs font-black text-slate-500 uppercase tracking-wide">
                {section.label}
              </h5>
            </div>

            <div className="flex-1 min-h-10 sm:min-h-[60px]">
              <p
                className={cn(
                  "text-xs sm:text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
                  section.value
                    ? "text-slate-700 font-semibold"
                    : "text-slate-500 italic font-medium"
                )}
              >
                {section.value ||
                  `No ${section.label.toLowerCase()} available.`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
