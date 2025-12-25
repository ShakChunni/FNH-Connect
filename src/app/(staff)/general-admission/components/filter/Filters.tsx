"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useFilterStore } from "../../stores/filterStore";
import {
  DepartmentFilter,
  DoctorFilter,
  StatusFilter,
  DateRangeFilter,
  ExportActionBar,
} from "./components";

/**
 * Filters Panel - Slide-out drawer from right
 * Contains all filter dropdowns with FNH brand styling
 */
export const Filters: React.FC = () => {
  const isOpen = useFilterStore((state) => state.panel.isOpen);
  const closeFilterPanel = useFilterStore((state) => state.closeFilterPanel);
  const clearAllFilters = useFilterStore((state) => state.clearAllFilters);
  const getActiveFilterCount = useFilterStore(
    (state) => state.getActiveFilterCount
  );

  const activeCount = getActiveFilterCount();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeFilterPanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeFilterPanel]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClearAll = useCallback(() => {
    clearAllFilters();
  }, [clearAllFilters]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeFilterPanel();
      }
    },
    [closeFilterPanel]
  );

  // Panel content
  const panelContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100000]"
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full
              bg-white shadow-2xl z-[100001]
              flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-panel-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-fnh-navy-dark to-fnh-navy">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    id="filter-panel-title"
                    className="text-lg font-semibold text-white"
                  >
                    Filters
                  </h2>
                  {activeCount > 0 && (
                    <p className="text-xs text-white/70">
                      {activeCount} filter{activeCount > 1 ? "s" : ""} active
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={closeFilterPanel}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10
                  transition-colors duration-200 cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Department Filter */}
              <DepartmentFilter />

              {/* Doctor Filter */}
              <DoctorFilter />

              {/* Status Filter */}
              <StatusFilter />

              {/* Date Range Filter */}
              <DateRangeFilter />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                {/* Clear All Button */}
                <button
                  onClick={handleClearAll}
                  disabled={activeCount === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                    bg-white border border-gray-200 rounded-xl
                    text-sm font-medium text-gray-600
                    hover:bg-gray-50 hover:border-gray-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All
                </button>

                {/* Apply/Close Button */}
                <button
                  onClick={closeFilterPanel}
                  className="flex-1 px-4 py-3
                    bg-gradient-to-r from-fnh-navy-dark to-fnh-navy rounded-xl
                    text-sm font-semibold text-white
                    hover:from-fnh-navy hover:to-fnh-navy-light
                    shadow-lg hover:shadow-xl
                    transition-all duration-200 cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render as portal
  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(panelContent, document.body);
};

export default Filters;
