"use client";

import React, { useState, useCallback, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetchDepartments } from "../hooks";
import { useFilterStore } from "../stores/filterStore";
import { FilterTriggerButton } from "./filter";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface AdmissionSearchProps {
  disabled?: boolean;
}

/**
 * Admission Search Component
 * Wraps the global SearchBar with admission-specific logic
 * Includes department quick filter and filter trigger button
 */
export const AdmissionSearch: React.FC<AdmissionSearchProps> = ({
  disabled = false,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const departmentButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch departments for dropdown
  const { data: departments = [] } = useFetchDepartments();

  // Get filter state from store (for department sync)
  const filters = useFilterStore((state) => state.filters);
  const setDepartmentId = useFilterStore((state) => state.setDepartmentId);
  const setSearch = useFilterStore((state) => state.setSearch);

  // Debounce search value
  const debouncedSearch = useDebounce(searchValue, 300);

  // Get selected department label
  const selectedDepartmentLabel =
    departments.find((d) => d.id === filters.departmentId)?.name ||
    "All Departments";

  // Effect to sync debounced search with store
  React.useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleDepartmentSelect = useCallback(
    (id: number | null) => {
      setDepartmentId(id);
      setIsDepartmentOpen(false);
    },
    [setDepartmentId]
  );

  return (
    <div
      className="max-w-4xl mx-auto"
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      <div className="flex items-center gap-3">
        {/* Main Search Bar Container */}
        <div
          className={`
            flex items-center flex-1 min-w-0
            bg-white border rounded-full 
            h-12 sm:h-14
            transition-all duration-300 ease-out
            ${
              isFocused
                ? "border-fnh-blue shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_0_16px_rgba(59,130,246,0.08)] ring-1 ring-fnh-blue/20"
                : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
            }
          `}
        >
          {/* Left: Department Dropdown - integrated into bar */}
          <div className="relative shrink-0 h-full">
            <button
              ref={departmentButtonRef}
              onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
              className="flex items-center gap-1.5 sm:gap-2 h-full px-4 sm:px-5 
                bg-fnh-navy-dark rounded-l-full text-white text-xs sm:text-sm font-medium 
                hover:bg-fnh-navy transition-colors duration-200 
                min-w-[100px] sm:min-w-[140px] max-w-[180px]
                justify-between cursor-pointer border-r border-fnh-navy-light/30"
            >
              <span className="truncate">{selectedDepartmentLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 shrink-0 ${
                  isDepartmentOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={isDepartmentOpen}
              onClose={() => setIsDepartmentOpen(false)}
              buttonRef={departmentButtonRef}
              className="min-w-[200px]"
            >
              <div className="py-1 max-h-[300px] overflow-y-auto">
                {/* All Departments option */}
                <button
                  onClick={() => handleDepartmentSelect(null)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                    filters.departmentId === null
                      ? "bg-fnh-navy text-white font-medium"
                      : "text-gray-700 hover:bg-slate-100"
                  }`}
                >
                  All Departments
                </button>

                {/* Department options */}
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => handleDepartmentSelect(dept.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                      filters.departmentId === dept.id
                        ? "bg-fnh-navy text-white font-medium"
                        : "text-gray-700 hover:bg-slate-100"
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </DropdownPortal>
          </div>

          {/* Center: Search Input */}
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
                placeholder="Search by patient name, phone, or admission number..."
                className="w-full h-full pl-10 sm:pl-12 pr-4 bg-transparent border-0 
                  focus:ring-0 focus:outline-none 
                  text-gray-700 text-sm sm:text-base 
                  placeholder:text-gray-400 placeholder:text-sm
                  rounded-r-full"
              />
            </div>
          </div>
        </div>

        {/* Filter Trigger Button */}
        <div className="shrink-0 h-12 sm:h-14 flex items-center">
          <FilterTriggerButton disabled={disabled} />
        </div>
      </div>
    </div>
  );
};

export default AdmissionSearch;
