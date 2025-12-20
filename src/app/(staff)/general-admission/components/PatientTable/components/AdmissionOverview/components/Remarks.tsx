"use client";
import React from "react";
import { MessageSquare } from "lucide-react";

interface RemarksProps {
  remarks: string | null;
}

export const Remarks: React.FC<RemarksProps> = ({ remarks }) => {
  if (!remarks) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5" /> Remarks / Notes
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {remarks}
      </p>
    </div>
  );
};
