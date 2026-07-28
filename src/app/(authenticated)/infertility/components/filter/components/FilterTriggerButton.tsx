"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { useInfertilityFilterStore } from "../../../stores/filterStore";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";

interface FilterTriggerButtonProps {
  disabled?: boolean;
  scope?: "patients" | "investigations";
}

/**
 * Filter Trigger Button - Pill button that opens the filter panel
 * Shows active filter count if any filters are set
 */
export const FilterTriggerButton: React.FC<FilterTriggerButtonProps> = ({
  disabled = false,
  scope = "investigations",
}) => {
  const openPatientFilterPanel = useInfertilityFilterStore(
    (state) => state.openFilterPanel,
  );
  const patientSearch = useInfertilityFilterStore((state) => state.search);
  const patientDateRange = useInfertilityFilterStore(
    (state) => state.dateRange,
  );
  const patientTestNames = useInfertilityFilterStore(
    (state) => state.testNames,
  );
  const patientLeadsFilter = useInfertilityFilterStore(
    (state) => state.filters.leadsFilter,
  );
  const isPatientPanelOpen = useInfertilityFilterStore(
    (state) => state.panel.isOpen,
  );
  const openInvestigationFilterPanel = useInfertilityTestFilterStore(
    (state) => state.openFilterPanel
  );
  const investigationFilters = useInfertilityTestFilterStore(
    (state) => state.filters,
  );
  const isInvestigationPanelOpen = useInfertilityTestFilterStore(
    (state) => state.panel.isOpen,
  );

  const isPatientScope = scope === "patients";
  const activeCount = isPatientScope
    ? [
        patientSearch.length >= 2,
        patientDateRange !== "all",
        patientLeadsFilter !== "All",
        patientTestNames.length > 0,
      ].filter(Boolean).length
    : [
        investigationFilters.orderedById !== null,
        investigationFilters.doneById !== null,
        investigationFilters.status !== "All",
        investigationFilters.testNames.length > 0,
        investigationFilters.dateRange !== "all",
        investigationFilters.search !== "",
      ].filter(Boolean).length;
  const openFilterPanel = isPatientScope
    ? openPatientFilterPanel
    : openInvestigationFilterPanel;
  const isOpen = isPatientScope
    ? isPatientPanelOpen
    : isInvestigationPanelOpen;

  return (
    <button
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openFilterPanel();
      }}
      type="button"
      disabled={disabled}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className={`
        relative flex h-full w-full items-center justify-center gap-2.5 px-5 sm:w-auto
        bg-white border rounded-full
        transition-all duration-300 ease-out
        ${
          activeCount > 0
            ? "border-emerald-600 bg-emerald-600/5 shadow-[0_0_0_3px_rgba(5,150,105,0.1)]"
            : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
        }
        ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        group
      `}
    >
      <SlidersHorizontal
        className={`w-4 h-4 transition-colors duration-200 ${
          activeCount > 0 ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
        }`}
      />
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          activeCount > 0 ? "text-emerald-600" : "text-gray-600 group-hover:text-gray-900"
        }`}
      >
        Filters
      </span>

      {activeCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center
            min-w-[20px] h-5 px-1.5 rounded-full
            bg-emerald-600 text-white text-[10px] font-bold
            shadow-[0_2px_8px_rgba(5,150,105,0.4)]
            animate-in zoom-in duration-300"
        >
          {activeCount}
        </span>
      )}
    </button>
  );
};
