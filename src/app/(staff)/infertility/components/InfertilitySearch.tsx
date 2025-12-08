"use client";

import React, { useState, useCallback } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";

// Department options for infertility page
const DEPARTMENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "infertility", label: "Infertility" },
];

interface InfertilitySearchProps {
  onFiltersChange: (filters: {
    search?: string;
    department?: string;
    dateRange?: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
  disabled?: boolean;
}

// Helper to calculate date range from option
const getDateRangeFromOption = (
  option: string
): { start?: Date; end?: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case "last_week": {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return { start: lastWeek, end: now };
    }
    case "last_month": {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return { start: lastMonth, end: now };
    }
    case "last_3_months": {
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      return { start: last3Months, end: now };
    }
    case "last_6_months": {
      const last6Months = new Date(today);
      last6Months.setMonth(last6Months.getMonth() - 6);
      return { start: last6Months, end: now };
    }
    case "this_year": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear, end: now };
    }
    default:
      return {};
  }
};

/**
 * Infertility Search Component
 * Wraps the global SearchBar with infertility-specific logic
 * Can be disabled during page loading
 */
export const InfertilitySearch: React.FC<InfertilitySearchProps> = ({
  onFiltersChange,
  disabled = false,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  // Debounce search value
  const debouncedSearch = useDebounce(searchValue, 300);

  // Effect to notify parent of filter changes
  React.useEffect(() => {
    const dateRange = getDateRangeFromOption(selectedDateRange);
    onFiltersChange({
      search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
      department: selectedDepartment !== "all" ? selectedDepartment : undefined,
      dateRange: selectedDateRange !== "all" ? selectedDateRange : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
  }, [debouncedSearch, selectedDepartment, selectedDateRange, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setSelectedDepartment(value);
  }, []);

  const handleDateRangeChange = useCallback((value: string) => {
    setSelectedDateRange(value);
  }, []);

  return (
    <div
      className="max-w-4xl mx-auto"
      style={{ pointerEvents: disabled ? "none" : "auto" }}
    >
      <SearchBar
        departments={DEPARTMENT_OPTIONS}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={handleDepartmentChange}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        placeholder="Search by patient name or mobile number..."
        showDateFilter={true}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={handleDateRangeChange}
      />
    </div>
  );
};

export default InfertilitySearch;
