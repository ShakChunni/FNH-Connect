"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { usePathologyFilterStore } from "../../../stores/filterStore";

interface FilterTriggerButtonProps {
  disabled?: boolean;
}

/**
 * Filter Trigger Button
 * Opens the filter panel, shows active filter count badge
 */
export const FilterTriggerButton: React.FC<FilterTriggerButtonProps> = ({
  disabled = false,
}) => {
  const openFilterPanel = usePathologyFilterStore(
    (state) => state.openFilterPanel
  );

  // Subscribe to actual filter values to ensure reactivity
  const filters = usePathologyFilterStore((state) => state.filters);

  // Calculate active count from filters
  const activeCount = React.useMemo(() => {
    let count = 0;
    if (filters.orderedById !== null) count++;
    if (filters.status !== "All") count++;
    if (filters.dateRange !== "all") count++;
    if (filters.testNames.length > 0) count++;
    if (filters.search !== "") count++;
    return count;
  }, [filters]);

  return (
    <button
      onClick={openFilterPanel}
      disabled={disabled}
      className="relative flex items-center justify-center gap-2 h-full px-4 sm:px-5 
        bg-white border border-gray-200 rounded-full
        text-gray-600 text-sm font-medium
        hover:bg-gray-50 hover:border-fnh-blue hover:text-fnh-blue
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer shadow-sm hover:shadow-md"
      aria-label="Open filters"
    >
      <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="hidden sm:inline">Filters</span>

      {/* Active filter count badge */}
      {activeCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center
            min-w-[20px] h-5 px-1.5
            bg-fnh-blue text-white text-xs font-bold
            rounded-full shadow-md animate-in zoom-in-50 duration-200"
        >
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterTriggerButton;
