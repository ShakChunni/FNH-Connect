"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";

interface FilterTriggerButtonProps {
  disabled?: boolean;
}

/**
 * Filter Trigger Button - Pill button that opens the filter panel
 * Shows active filter count if any filters are set
 */
export const FilterTriggerButton: React.FC<FilterTriggerButtonProps> = ({
  disabled = false,
}) => {
  const openFilterPanel = useInfertilityTestFilterStore(
    (state) => state.openFilterPanel
  );
  const getActiveFilterCount = useInfertilityTestFilterStore(
    (state) => state.getActiveFilterCount
  );

  const activeCount = getActiveFilterCount();

  return (
    <button
      onClick={openFilterPanel}
      disabled={disabled}
      className={`
        relative flex items-center gap-2.5 h-full px-5
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
