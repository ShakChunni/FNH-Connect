"use client";
import React from "react";
import { Activity } from "lucide-react";
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
        Test Details
      </h4>

      <div className="space-y-4">
        <div className="pb-4 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-tight">
            Test Category
          </p>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-fnh-teal" />
            {patient.testCategory}
          </p>
        </div>

        <div className="pb-4 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-tight">
            Ordered By
          </p>
          <p
            className="text-sm font-semibold text-gray-800 truncate"
            title={patient.orderedBy || ""}
          >
            {patient.orderedBy || "Self / N/A"}
          </p>
        </div>

        <div className="pb-4 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-tight">
            Report Status
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide",
              patient.isCompleted
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {patient.isCompleted ? "Completed" : "Pending"}
          </span>
        </div>

        <div>
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-tight">
            Report Delivery
          </p>
          <p className="font-semibold text-gray-800 text-[13px]">
            {formatDate(patient.reportDate)}
          </p>
        </div>
      </div>
    </div>
  );
};
