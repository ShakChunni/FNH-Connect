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
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return "Today";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };
  const sections = [
    {
      label: "Chief Complaint",
      value: chiefComplaint,
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-600 border-amber-100",
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
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
            <h4 className="text-[11px] sm:text-xs font-black text-gray-800 uppercase tracking-wide leading-tight">
              Clinical History
            </h4>
            <p className="hidden sm:block text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tight">
              Diagnostic & clinical observations
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-white border border-slate-100 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-slate-600">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:border-indigo-100 transition-all duration-300 flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={cn(
                  "p-1.5 sm:p-2 rounded-lg sm:rounded-xl border shrink-0 transition-transform group-hover:scale-110",
                  section.color
                )}
              >
                <section.icon
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  strokeWidth={2.5}
                />
              </div>
              <h5 className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wide">
                {section.label}
              </h5>
            </div>

            <div className="flex-1 min-h-[40px] sm:min-h-[60px]">
              <p
                className={cn(
                  "text-xs sm:text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
                  section.value
                    ? "text-gray-700 font-semibold"
                    : "text-gray-400 italic font-medium"
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
