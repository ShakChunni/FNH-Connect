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

interface HistorySectionProps {
  medicalHistory: string | null;
  surgicalHistory: string | null;
  menstrualHistory: string | null;
  contraceptiveHistory: string | null;
  chiefComplaint: string | null;
  notes: string | null;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  medicalHistory,
  surgicalHistory,
  menstrualHistory,
  contraceptiveHistory,
  chiefComplaint,
  notes,
}) => {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-indigo-600" />
        Patient Medical History
      </h4>

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="group transition-all duration-200">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 p-2 rounded-lg border ${section.color} shrink-0`}
              >
                <section.icon size={16} />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {section.label}
                </span>
                <p
                  className={`text-sm leading-relaxed ${
                    section.value
                      ? "text-gray-700 font-medium"
                      : "text-gray-400 italic font-normal"
                  }`}
                >
                  {section.value ||
                    `No ${section.label.toLowerCase()} recorded.`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
