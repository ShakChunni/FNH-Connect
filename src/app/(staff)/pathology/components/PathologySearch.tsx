"use client";

import React, { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathologyFilterStore } from "../stores/filterStore";
import { FilterTriggerButton } from "./filter";

interface PathologySearchProps {
  disabled?: boolean;
}

/**
 * Pathology Search Component
 * Clean search bar with filter trigger button
 * Connects to Zustand filter store
 */
export const PathologySearch: React.FC<PathologySearchProps> = ({
  disabled = false,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Get filter state from store
  const filters = usePathologyFilterStore((state) => state.filters);
  const setSearch = usePathologyFilterStore((state) => state.setSearch);

  // Debounce search value
  const debouncedSearch = useDebounce(searchValue, 300);

  // Effect to sync debounced search with store
  React.useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Sync local state when store's search is cleared externally
  React.useEffect(() => {
    if (filters.search === "" && searchValue !== "") {
      setSearchValue("");
    }
  }, [filters.search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  return (
    <div
      className="w-full max-w-4xl mx-auto"
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Main Search Bar Container */}
        <div
          className={`
            flex items-center flex-1 min-w-0
            bg-white border rounded-full 
            h-11 sm:h-14
            transition-all duration-300 ease-out
            ${
              isFocused
                ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          {/* Search Input */}
          <div className="flex-1 min-w-0 h-full">
            <div className="relative flex items-center h-full">
              <Search
                className={`absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-fnh-blue" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search patient, test number, phone..."
                className="w-full h-full pl-10 sm:pl-12 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-xs sm:text-base 
                  placeholder:text-gray-400 placeholder:text-xs sm:placeholder:text-sm
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Filter Trigger Button */}
        <div className="shrink-0 h-11 sm:h-14 flex items-center">
          <FilterTriggerButton disabled={disabled} />
        </div>
      </div>
    </div>
  );
};

export default PathologySearch;
