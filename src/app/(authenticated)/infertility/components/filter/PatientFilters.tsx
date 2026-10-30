"use client";

import React, { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { DRAWER_TRANSITION } from "@/lib/motion";
import { useInfertilityFilterStore } from "../../stores/filterStore";
import { DateRangeFilter, TestFilter } from "./components";

export const PatientFilters: React.FC = () => {
  const isOpen = useInfertilityFilterStore((state) => state.panel.isOpen);
  const closeFilterPanel = useInfertilityFilterStore(
    (state) => state.closeFilterPanel,
  );
  const clearAllFilters = useInfertilityFilterStore(
    (state) => state.clearAllFilters,
  );
  const search = useInfertilityFilterStore((state) => state.search);
  const dateRange = useInfertilityFilterStore((state) => state.dateRange);
  const testNames = useInfertilityFilterStore((state) => state.testNames);
  const leadsFilter = useInfertilityFilterStore(
    (state) => state.filters.leadsFilter,
  );
  const activeCount = [
    search.length >= 2,
    dateRange !== "all",
    leadsFilter !== "All",
    testNames.length > 0,
  ].filter(Boolean).length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) closeFilterPanel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeFilterPanel, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) closeFilterPanel();
    },
    [closeFilterPanel],
  );

  return (
    <ClientPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 z-[100000] bg-slate-950/50 "
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={DRAWER_TRANSITION}
              className="fixed inset-y-0 right-0 z-[100001] flex h-dvh max-h-dvh w-full max-w-full transform-gpu flex-col overflow-hidden bg-white shadow-none will-change-transform sm:w-[min(400px,calc(100vw-1rem))] sm:rounded-l-[2rem] sm:shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="patient-filter-panel-title"
            >
              <header className="flex shrink-0 items-center justify-between bg-fnh-navy px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/15 p-2.5 ">
                    <SlidersHorizontal className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2
                      id="patient-filter-panel-title"
                      className="text-lg font-bold tracking-tight text-white"
                    >
                      Patient Filters
                    </h2>
                    <p className="text-xs font-medium text-emerald-100">
                      Choose the patient report period
                    </p>
                    {activeCount > 0 && (
                      <p className="mt-0.5 text-xs font-medium text-fnh-yellow">
                        {activeCount} filter{activeCount === 1 ? "" : "s"} active
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeFilterPanel}
                  className="rounded-xl p-2.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close patient filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="custom-scrollbar min-h-0 flex-1 overscroll-contain overflow-y-auto p-4 sm:p-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <DateRangeFilter scope="patients" />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <TestFilter scope="patients" />
                </div>
              </div>

              <footer className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    disabled={activeCount === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear filters
                  </button>
                  <button
                    type="button"
                    onClick={closeFilterPanel}
                    className="flex-1 rounded-xl bg-fnh-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-fnh-blue-dark"
                  >
                    Apply Filters
                  </button>
                </div>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </ClientPortal>
  );
};

export default PatientFilters;
