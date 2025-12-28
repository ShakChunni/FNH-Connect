"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { usePathologyFilterStore } from "../../stores/filterStore";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// Status options for pathology
const STATUS_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "Completed", label: "Completed" },
  { value: "Pending", label: "Pending" },
] as const;

// Date range options
const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "custom", label: "Custom Range" },
] as const;

/**
 * Filters Panel - Slide-out drawer from right
 * Pathology version: Status and Date filters only (no Department)
 */
export const Filters: React.FC = () => {
  const isOpen = usePathologyFilterStore((state) => state.panel.isOpen);
  const closeFilterPanel = usePathologyFilterStore(
    (state) => state.closeFilterPanel
  );
  const clearAllFilters = usePathologyFilterStore(
    (state) => state.clearAllFilters
  );
  const getActiveFilterCount = usePathologyFilterStore(
    (state) => state.getActiveFilterCount
  );
  const filters = usePathologyFilterStore((state) => state.filters);
  const setStatus = usePathologyFilterStore((state) => state.setStatus);
  const setDateRange = usePathologyFilterStore((state) => state.setDateRange);
  const setCustomDateRange = usePathologyFilterStore(
    (state) => state.setCustomDateRange
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

  const handleDateRangeChange = (
    range: { from?: Date; to?: Date } | undefined
  ) => {
    if (range?.from && range?.to) {
      setCustomDateRange(range.from, range.to);
    }
  };

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
              type: "tween",
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full
              bg-white
              shadow-none sm:shadow-[-8px_0_30px_rgba(0,0,0,0.15)] z-[100001]
              flex flex-col sm:rounded-l-[2rem] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-panel-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-fnh-navy-dark to-fnh-navy">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
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
                className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15
                  transition-all duration-200 cursor-pointer backdrop-blur-sm"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Status Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-fnh-blue" />
                  Test Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatus(option.value)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        filters.status === option.value
                          ? "bg-fnh-navy text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 text-fnh-blue" />
                  Date Range
                </label>
                <div className="space-y-3">
                  {/* Preset Options */}
                  <div className="grid grid-cols-2 gap-2">
                    {DATE_OPTIONS.filter((o) => o.value !== "custom").map(
                      (option) => (
                        <button
                          key={option.value}
                          onClick={() => setDateRange(option.value)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                            filters.dateRange === option.value
                              ? "bg-fnh-navy text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    )}
                  </div>

                  {/* Custom Date Picker */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Or select custom range:
                    </p>
                    <DateRangePicker
                      value={
                        filters.startDate && filters.endDate
                          ? { from: filters.startDate, to: filters.endDate }
                          : undefined
                      }
                      onChange={handleDateRangeChange}
                    />
                  </div>
                </div>
              </div>
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
