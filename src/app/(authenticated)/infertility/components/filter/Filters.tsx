"use client";

import React, { useEffect, useCallback } from "react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useInfertilityTestFilterStore } from "../../stores/testFilterStore";
import {
  DoctorFilter,
  StatusFilter,
  DateRangeFilter,
  TestFilter,
} from "./components";

/**
 * Filters Panel for Investigations - Slide-out drawer from right
 */
export const Filters: React.FC = () => {
  const isOpen = useInfertilityTestFilterStore((state) => state.panel.isOpen);
  const closeFilterPanel = useInfertilityTestFilterStore((state) => state.closeFilterPanel);
  const clearAllFilters = useInfertilityTestFilterStore((state) => state.clearAllFilters);
  const getActiveFilterCount = useInfertilityTestFilterStore((state) => state.getActiveFilterCount);

  const activeCount = getActiveFilterCount();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeFilterPanel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeFilterPanel]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeFilterPanel();
  }, [closeFilterPanel]);

  const panelContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100000]"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-y-0 right-0 z-[100001] flex h-dvh max-h-dvh w-full max-w-full
              transform-gpu flex-col overflow-hidden bg-white shadow-none will-change-transform
              sm:w-[min(400px,calc(100vw-1rem))] sm:rounded-l-[2rem]
              sm:shadow-[-8px_0_30px_rgba(0,0,0,0.15)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="investigation-filter-panel-title"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-linear-to-r from-emerald-950 to-emerald-900 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 id="investigation-filter-panel-title" className="text-lg font-bold text-white tracking-tight">Investigation Filters</h2>
                  {activeCount > 0 && (
                    <p className="text-xs text-fnh-yellow font-medium">{activeCount} filter(s) active</p>
                  )}
                </div>
              </div>
              <button onClick={closeFilterPanel} className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overscroll-contain overflow-y-auto p-4 sm:p-6">
              <DoctorFilter />
              <StatusFilter />
              <DateRangeFilter />
              <TestFilter />
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAllFilters}
                  disabled={activeCount === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All
                </button>
                <button
                  onClick={closeFilterPanel}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-emerald-950 to-emerald-900 rounded-xl text-sm font-semibold text-white hover:from-emerald-900 hover:to-emerald-800 shadow-lg transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <ClientPortal>
      {panelContent}
    </ClientPortal>
  );
};
