"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { usePathologyFilterStore } from "../../../stores/filterStore";

interface FilterTriggerButtonProps {
  disabled?: boolean;
}

/**
 * Filter Trigger Button - opens the filter panel
 */
export const FilterTriggerButton: React.FC<FilterTriggerButtonProps> = ({
  disabled = false,
}) => {
  const toggleFilterPanel = usePathologyFilterStore(
    (state) => state.toggleFilterPanel
  );
  const getActiveFilterCount = usePathologyFilterStore(
    (state) => state.getActiveFilterCount
  );

  const activeCount = getActiveFilterCount();

  return (
    <button
      onClick={toggleFilterPanel}
      disabled={disabled}
      className={`
        relative h-full px-4 sm:px-5
        flex items-center justify-center gap-2
        rounded-full
        font-medium text-sm
        transition-all duration-300 ease-out
        cursor-pointer
        ${
          activeCount > 0
            ? "bg-fnh-navy text-white shadow-lg hover:shadow-xl hover:bg-fnh-navy-dark"
            : "bg-white text-gray-600 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={`Open filters${
        activeCount > 0 ? ` (${activeCount} active)` : ""
      }`}
    >
      <SlidersHorizontal className="w-4 h-4" />
      <span className="hidden sm:inline">Filters</span>

      {/* Active filter count badge */}
      {activeCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center
          w-5 h-5 text-[10px] font-bold
          bg-fnh-yellow text-fnh-navy
          rounded-full shadow-md ring-2 ring-white"
        >
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterTriggerButton;
