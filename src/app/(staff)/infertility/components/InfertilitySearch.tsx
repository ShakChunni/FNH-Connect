"use client";

import React, { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfertilityFilterStore } from "../stores/filterStore";
import { ReportTriggerButton, DateRangePill } from "./filter";

interface InfertilitySearchProps {
  disabled?: boolean;
  recordCount?: number;
}

/**
 * Infertility Search Component
 * Search bar with date range pill and report pill buttons
 * Mobile-optimized for screens < sm
 */
export const InfertilitySearch: React.FC<InfertilitySearchProps> = ({
  disabled = false,
  recordCount = 0,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Get filter state from store
  const search = useInfertilityFilterStore((state) => state.search);
  const setSearch = useInfertilityFilterStore((state) => state.setSearch);

  // Debounce search value
  const debouncedSearch = useDebounce(searchValue, 300);

  // Effect to sync debounced search with store
  React.useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Sync local state when store's search is cleared externally
  React.useEffect(() => {
    if (search === "" && searchValue !== "") {
      setSearchValue("");
    }
  }, [search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  return (
    <div
      className="w-full max-w-4xl mx-auto"
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      {/* Mobile Layout: Stacked */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Search Bar - Full Width on Mobile */}
        <div
          className={`
            flex items-center w-full
            bg-white border rounded-full 
            h-11
            transition-all duration-300 ease-out
            ${
              isFocused
                ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          <div className="flex-1 min-w-0 h-full">
            <div className="relative flex items-center h-full">
              <Search
                className={`absolute left-3 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-fnh-blue" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search patient, phone..."
                className="w-full h-full pl-10 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-xs 
                  placeholder:text-gray-400 placeholder:text-xs
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Date & Report Buttons - 50/50 on Mobile */}
        <div className="flex gap-2 w-full">
          <div className="flex-1 h-11">
            <DateRangePill disabled={disabled} />
          </div>
          <div className="flex-1 h-11">
            <ReportTriggerButton
              disabled={disabled}
              recordCount={recordCount}
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout: Inline */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Main Search Bar Container */}
        <div
          className={`
            flex items-center flex-1 min-w-0
            bg-white border rounded-full 
            h-14
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
                className={`absolute left-5 w-5 h-5 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-fnh-blue" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search by patient name, phone number, or hospital..."
                className="w-full h-full pl-14 pr-6 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-base 
                  placeholder:text-gray-400 placeholder:text-sm
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Date Range Pill */}
        <div className="shrink-0 h-14 flex items-center">
          <DateRangePill disabled={disabled} />
        </div>

        {/* Report Trigger Button */}
        <div className="shrink-0 h-14 flex items-center">
          <ReportTriggerButton disabled={disabled} recordCount={recordCount} />
        </div>
      </div>
    </div>
  );
};

export default InfertilitySearch;
