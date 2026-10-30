"use client";

import React, { useState, useRef, useCallback } from "react";
import { Search, ChevronDown, Calendar } from "lucide-react";
import { DropdownPortal } from "./DropdownPortal";

export interface DepartmentOption {
  value: string;
  label: string;
}

export interface DateRangeOption {
  value: string;
  label: string;
}

// Default date range options
export const DEFAULT_DATE_RANGES: DateRangeOption[] = [
  { value: "all", label: "All Time" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_week", label: "Last Week" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "this_year", label: "This Year" },
];

export interface SearchBarProps {
  /** Available department options for the dropdown */
  departments: DepartmentOption[];
  /** Currently selected department */
  selectedDepartment: string;
  /** Callback when department changes */
  onDepartmentChange: (value: string) => void;
  /** Current search value */
  searchValue: string;
  /** Callback when search value changes */
  onSearchChange: (value: string) => void;
  /** Callback when search is submitted (Enter or button click) */
  onSearch?: (value: string) => void;
  /** Placeholder for search input */
  placeholder?: string;
  /** Whether to show department filter dropdown */
  showDepartmentFilter?: boolean;
  /** Whether to show date filter pill */
  showDateFilter?: boolean;
  /** Selected date range */
  selectedDateRange?: string;
  /** Callback when date range changes */
  onDateRangeChange?: (value: string) => void;
  /** Custom date range options (uses defaults if not provided) */
  dateRangeOptions?: DateRangeOption[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  departments,
  selectedDepartment,
  onDepartmentChange,
  searchValue,
  onSearchChange,
  onSearch,
  placeholder = "Search by patient name or mobile number...",
  showDepartmentFilter = true,
  showDateFilter = true,
  selectedDateRange = "all",
  onDateRangeChange,
  dateRangeOptions = DEFAULT_DATE_RANGES,
}) => {
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const departmentButtonRef = useRef<HTMLButtonElement>(null);
  const dateRangeButtonRef = useRef<HTMLButtonElement>(null);

  const selectedDepartmentLabel =
    departments.find((d) => d.value === selectedDepartment)?.label || "All";

  const selectedDateRangeLabel =
    dateRangeOptions.find((d) => d.value === selectedDateRange)?.label ||
    "All Time";

  const handleDepartmentSelect = useCallback(
    (value: string) => {
      onDepartmentChange(value);
      setIsDepartmentOpen(false);
    },
    [onDepartmentChange]
  );

  const handleDateRangeSelect = useCallback(
    (value: string) => {
      onDateRangeChange?.(value);
      setIsDateRangeOpen(false);
    },
    [onDateRangeChange]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(searchValue);
    },
    [onSearch, searchValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSearch?.(searchValue);
      }
    },
    [onSearch, searchValue]
  );

  return (
    <div className="w-full">
      {/* Main Search Bar Container */}
      <div
        className={`
          flex items-center w-full
          bg-white border rounded-full
          h-12 sm:h-14
          transition-colors duration-200 ease-out
          ${
            isFocused
              ? "border-fnh-blue shadow-sm ring-1 ring-fnh-blue/20"
              : "border-slate-200 shadow-sm hover:border-slate-300"
          }
        `}
      >
        {/* Left: Department Dropdown - integrated into bar */}
        {showDepartmentFilter && (
          <div className="relative shrink-0 h-full">
            <button
              ref={departmentButtonRef}
              onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
              className="flex items-center gap-1.5 sm:gap-2 h-full px-4 sm:px-5 bg-fnh-navy-dark rounded-l-full text-white text-xs sm:text-sm font-medium hover:bg-fnh-navy transition-colors duration-200 min-w-[90px] sm:min-w-[110px] justify-between cursor-pointer border-r border-fnh-navy-light/30"
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
              matchButtonWidth={false}
              className="w-52"
            >
              <div className="py-1 max-h-[300px] overflow-y-auto">
                {departments.map((dept) => (
                  <button
                    key={dept.value}
                    onClick={() => handleDepartmentSelect(dept.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                      selectedDepartment === dept.value
                        ? "bg-fnh-navy text-white font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>
            </DropdownPortal>
          </div>
        )}

        {/* Center: Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className={`flex-1 min-w-0 h-full ${
            !showDepartmentFilter ? "rounded-l-full overflow-hidden" : ""
          }`}
        >
          <div className="relative flex items-center h-full">
            <Search
              className={`absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none transition-colors duration-200 ${
                isFocused ? "text-fnh-blue" : "text-slate-400"
              }`}
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full h-full pl-10 sm:pl-12 pr-4 bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-700 text-sm sm:text-base placeholder:text-slate-400 placeholder:text-sm ${
                !showDepartmentFilter ? "rounded-l-full" : ""
              }`}
            />
          </div>
        </form>

        {/* Right: Date Range - integrated into bar */}
        {showDateFilter && (
          <div className="relative shrink-0 h-full">
            <button
              ref={dateRangeButtonRef}
              onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
              className={`flex items-center gap-1.5 sm:gap-2 h-full px-4 sm:px-5 rounded-r-full text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer ${
                selectedDateRange !== "all"
                  ? "bg-fnh-navy text-white hover:bg-fnh-navy-light"
                  : "bg-slate-200 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="max-w-[5.5rem] truncate sm:max-w-none">
                {selectedDateRangeLabel}
              </span>
              <ChevronDown
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${
                  isDateRangeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={isDateRangeOpen}
              onClose={() => setIsDateRangeOpen(false)}
              buttonRef={dateRangeButtonRef}
              matchButtonWidth={false}
              className="w-52"
            >
              <div className="py-1 max-h-[300px] overflow-y-auto">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDateRangeSelect(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                      selectedDateRange === option.value
                        ? "bg-fnh-navy text-white font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </DropdownPortal>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
