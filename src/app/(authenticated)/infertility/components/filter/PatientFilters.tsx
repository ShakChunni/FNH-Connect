"use client";

import React, { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { useInfertilityFilterStore } from "../../stores/filterStore";
import { DateRangeFilter } from "./components";

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
  const leadsFilter = useInfertilityFilterStore(
    (state) => state.filters.leadsFilter,
  );
  const activeCount = [
    search.length >= 2,
    dateRange !== "all",
    leadsFilter !== "All",
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
              className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "tween",
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="fixed inset-y-0 right-0 z-[100001] flex h-dvh max-h-dvh w-full max-w-full transform-gpu flex-col overflow-hidden bg-white shadow-none will-change-transform sm:w-[min(400px,calc(100vw-1rem))] sm:rounded-l-[2rem] sm:shadow-[-8px_0_30px_rgba(0,0,0,0.15)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="patient-filter-panel-title"
            >
              <header className="flex shrink-0 items-center justify-between bg-linear-to-r from-emerald-950 to-emerald-900 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
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
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  <DateRangeFilter scope="patients" />
                </div>
              </div>

              <footer className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    disabled={activeCount === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={closeFilterPanel}
                    className="flex-1 rounded-xl bg-linear-to-r from-emerald-950 to-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-900 hover:to-emerald-800 hover:shadow-xl"
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
