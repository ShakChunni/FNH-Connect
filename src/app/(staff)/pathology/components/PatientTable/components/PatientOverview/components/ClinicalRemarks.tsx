"use client";
import React from "react";
import { FileText } from "lucide-react";

interface ClinicalRemarksProps {
  remarks: string | null;
}

export const ClinicalRemarks: React.FC<ClinicalRemarksProps> = ({
  remarks,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <FileText className="w-3.5 h-3.5" /> Clinical Remarks
      </h4>
      <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
        {remarks || "No clinical remarks added."}
      </p>
    </div>
  );
};
