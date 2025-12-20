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
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Test Details
      </h4>

      <div className="space-y-4">
        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Test Category</p>
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-fnh-teal" />
            {patient.testCategory}
          </p>
        </div>

        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Ordered By</p>
          <p
            className="font-semibold text-gray-800 truncate"
            title={patient.orderedBy || ""}
          >
            {patient.orderedBy || "Self / N/A"}
          </p>
        </div>

        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Report Status</p>
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
          <p className="text-xs text-gray-400 mb-1">Report Delivery</p>
          <p className="font-medium text-gray-800 text-sm">
            {formatDate(patient.reportDate)}
          </p>
        </div>
      </div>
    </div>
  );
};
