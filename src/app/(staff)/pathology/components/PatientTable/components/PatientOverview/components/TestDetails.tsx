"use client";
import React from "react";
import {
  Activity,
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { PathologyPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";

interface TestDetailsProps {
  patient: PathologyPatientData;
}

export const TestDetails: React.FC<TestDetailsProps> = ({ patient }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not Scheduled";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const details = [
    {
      label: "Test Category",
      value: patient.testCategory,
      icon: Activity,
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      label: "Ordered By",
      value: patient.orderedBy || "Self / N/A",
      icon: UserCheck,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Report Status",
      value: patient.isCompleted ? "Completed" : "Pending",
      icon: CheckCircle2,
      color: patient.isCompleted
        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
        : "bg-amber-50 text-amber-600 border-amber-100",
      isBadge: true,
    },
    {
      label: "Report Delivery",
      value: formatDate(patient.reportDate),
      icon: Calendar,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
  ];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-teal-600 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center gap-2">
        <ClipboardList size={14} className="text-white sm:w-4 sm:h-4" />
        <h4 className="text-[11px] sm:text-sm font-bold text-white uppercase tracking-wide">
          Test Info
        </h4>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
        {details.map((item, idx) => (
          <div
            key={idx}
            className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div
              className={cn(
                "p-1.5 sm:p-2 rounded-md sm:rounded-lg border shrink-0 transition-transform group-hover:scale-110",
                item.color
              )}
            >
              <item.icon
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                {item.label}
              </p>
              {item.isBadge ? (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold uppercase",
                    patient.isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {item.value}
                </span>
              ) : (
                <p
                  className="text-xs sm:text-sm font-bold text-gray-800 truncate"
                  title={item.value}
                >
                  {item.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
