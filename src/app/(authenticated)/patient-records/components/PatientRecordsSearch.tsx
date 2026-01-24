"use client";

import React, { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePatientActions, useFilters } from "../stores";

interface PatientRecordsSearchProps {
  disabled?: boolean;
  recordCount?: number;
}

/**
 * Patient Records Search Component
 * Clean search bar similar to pathology module
 */
export const PatientRecordsSearch: React.FC<PatientRecordsSearchProps> = ({
  disabled = false,
  recordCount = 0,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Get filter state and actions from store
  const filters = useFilters();
  const { setSearch } = usePatientActions();

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
      {/* Mobile Layout */}
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
                ? "border-blue-600 shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-blue-600/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          <div className="flex-1 min-w-0 h-full">
            <div className="relative flex items-center h-full">
              <Search
                className={`absolute left-3 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search patient name or phone..."
                className="w-full h-full pl-10 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-xs 
                  placeholder:text-gray-400 placeholder:text-xs
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Record Count */}
        {recordCount > 0 && (
          <div className="text-xs text-gray-500 text-center">
            {recordCount} patient{recordCount !== 1 ? "s" : ""} found
          </div>
        )}
      </div>

      {/* Desktop Layout */}
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
                ? "border-blue-600 shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-blue-600/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          {/* Search Input */}
          <div className="flex-1 min-w-0 h-full">
            <div className="relative flex items-center h-full">
              <Search
                className={`absolute left-4 w-5 h-5 pointer-events-none transition-colors duration-200 ${
                  isFocused ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search by patient name or phone number..."
                className="w-full h-full pl-12 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-base 
                  placeholder:text-gray-400 placeholder:text-sm
                  rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Record Count Badge */}
        {recordCount > 0 && (
          <div className="shrink-0 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            {recordCount} patient{recordCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecordsSearch;
