"use client";

import React, { useEffect, useCallback } from "react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { motion, AnimatePresence } from "framer-motion";
import { backdropVariants } from "@/components/ui/modal-animations";
import { DRAWER_TRANSITION } from "@/lib/motion";
import {
  BadgeCheck,
  CircleDollarSign,
  Percent,
  X,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { FinancialFilterSelect } from "@/components/ui";
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
  const filters = useFilterStore((state) => state.filters);
  const hasDue = useFilterStore((state) => state.filters.hasDue);
  const hasDiscount = useFilterStore((state) => state.filters.hasDiscount);
  const isDischarged = useFilterStore((state) => state.filters.isDischarged);
  const setHasDue = useFilterStore((state) => state.setHasDue);
  const setHasDiscount = useFilterStore((state) => state.setHasDiscount);
  const setIsDischarged = useFilterStore((state) => state.setIsDischarged);

  const activeCount = [
    filters.departmentId !== null,
    filters.doctorId !== null,
    filters.status !== "All",
    filters.dateRange !== "all",
    filters.search !== "",
    filters.hasDue !== null,
    filters.hasDiscount !== null,
    filters.isDischarged !== null,
  ].filter(Boolean).length;

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
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-slate-950/50 z-[100000]"
            aria-hidden="true"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={DRAWER_TRANSITION}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full
              bg-white
              shadow-none sm:shadow-xl z-[100001]
              flex flex-col sm:rounded-l-[2rem] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-panel-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-fnh-navy">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    id="filter-panel-title"
                    className="text-lg font-bold text-white tracking-tight"
                  >
                    Filters
                  </h2>
                  {activeCount > 0 && (
                    <p className="text-xs text-fnh-yellow font-medium">
                      {activeCount} filter{activeCount > 1 ? "s" : ""} active
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={closeFilterPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Department Filter */}
              <DepartmentFilter />

              {/* Doctor Filter */}
              <DoctorFilter />

              {/* Status Filter */}
              <StatusFilter />

              {/* Date Range Filter */}
              <DateRangeFilter />

              <FinancialFilterSelect
                label="Due"
                icon={CircleDollarSign}
                value={hasDue}
                onChange={setHasDue}
                activeLabel="Patients with due"
              />

              <FinancialFilterSelect
                label="Discount"
                icon={Percent}
                value={hasDiscount}
                onChange={setHasDiscount}
                activeLabel="Patients with discount"
              />

              <FinancialFilterSelect
                label="Discharged"
                icon={BadgeCheck}
                value={isDischarged}
                onChange={setIsDischarged}
                activeLabel="Discharged patients"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                {/* Clear All Button */}
                <button
                  onClick={handleClearAll}
                  disabled={activeCount === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                    bg-white border border-slate-200 rounded-xl
                    text-sm font-medium text-slate-600
                    hover:bg-slate-50 hover:border-slate-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear filters
                </button>

                {/* Apply/Close Button */}
                <button
                  onClick={closeFilterPanel}
                  className="flex-1 px-4 py-3
                    bg-blue-600 hover:bg-blue-700 rounded-xl
                    text-sm font-semibold text-white
                    transition-colors cursor-pointer"
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

  return (
    <ClientPortal>
      {panelContent}
    </ClientPortal>
  );
};

export default Filters;
