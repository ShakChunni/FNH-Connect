"use client";
import React from "react";
import { FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalRemarksProps {
  remarks: string | null;
}

export const ClinicalRemarks: React.FC<ClinicalRemarksProps> = ({
  remarks,
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-amber-500 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center gap-2">
        <MessageSquare size={14} className="text-white sm:w-4 sm:h-4" />
        <h4 className="text-[11px] sm:text-sm font-bold text-white uppercase tracking-wide">
          Remarks
        </h4>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5">
        <div
          className={cn(
            "rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[60px] sm:min-h-[100px]",
            remarks
              ? "bg-amber-50/50 border border-amber-100/50"
              : "bg-slate-50 border border-slate-100"
          )}
        >
          <p
            className={cn(
              "text-xs sm:text-sm leading-relaxed whitespace-pre-wrap",
              remarks ? "text-amber-900 font-medium" : "text-gray-400 italic"
            )}
          >
            {remarks || "No remarks added."}
          </p>
        </div>
      </div>
    </div>
  );
};
