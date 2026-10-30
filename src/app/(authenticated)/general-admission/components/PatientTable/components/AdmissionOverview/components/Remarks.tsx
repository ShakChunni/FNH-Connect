"use client";
import React from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface RemarksProps {
  remarks: string | null;
}

export const Remarks: React.FC<RemarksProps> = ({ remarks }) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-amber-100 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center gap-2">
        <MessageSquare size={14} className="text-amber-900 sm:w-4 sm:h-4" />
        <h4 className="text-2xs sm:text-sm font-bold text-amber-900 uppercase tracking-wide">
          Remarks
        </h4>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5">
        <div
          className={cn(
            "rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[60px] sm:min-h-[100px]",
            remarks
              ? "bg-amber-50 border border-amber-100"
              : "bg-slate-50 border border-slate-100"
          )}
        >
          <p
            className={cn(
              "text-xs sm:text-sm leading-relaxed whitespace-pre-wrap",
              remarks ? "text-amber-900 font-medium" : "text-slate-500 italic"
            )}
          >
            {remarks || "No remarks added."}
          </p>
        </div>
      </div>
    </div>
  );
};
