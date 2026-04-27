"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileDown, X, RotateCcw, BarChart3, FileText, FileSpreadsheet } from "lucide-react";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";
import { useInfertilityTestReportActions } from "../../../stores/testFilterStore";
import { InvestigationReportTriggerButton } from "./InvestigationReportTriggerButton";

export const ExportActionBar: React.FC<{ recordCount?: number }> = ({ recordCount = 0 }) => {
  const getActiveFilterCount = useInfertilityTestFilterStore((state) => state.getActiveFilterCount);
  const clearAllFilters = useInfertilityTestFilterStore((state) => state.clearAllFilters);
  const activeCount = getActiveFilterCount();

  if (activeCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-fit"
    >
      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-gray-200 px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
          <div className="flex items-center justify-center w-6 h-6 bg-fnh-blue text-white text-[10px] font-bold rounded-full">
            {activeCount}
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Filters Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          <InvestigationReportTriggerButton recordCount={recordCount} />
          
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-fnh-blue transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
};
