"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfertilityFilterStore } from "../stores/filterStore";
import { useInfertilityTestFilterStore } from "../stores/testFilterStore";
import { ReportTriggerButton, DateRangePill, FilterTriggerButton } from "./filter";

interface InfertilitySearchProps {
  disabled?: boolean;
  recordCount?: number;
  activeTab: "patients" | "investigations";
}

/**
 * Infertility Search Component
 * Adaptive search bar that switches between Patient and Investigation stores
 */
export const InfertilitySearch: React.FC<InfertilitySearchProps> = ({
  disabled = false,
  recordCount = 0,
  activeTab,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Patient Store
  const patientSearch = useInfertilityFilterStore((state) => state.search);
  const setPatientSearch = useInfertilityFilterStore((state) => state.setSearch);

  // Investigation Store
  const investigationSearch = useInfertilityTestFilterStore((state) => state.filters.search);
  const setInvestigationSearch = useInfertilityTestFilterStore((state) => state.setSearch);

  // Determine current search value from stores
  const currentStoreSearch = activeTab === "patients" ? patientSearch : investigationSearch;

  // Debounce search value
  const debouncedSearch = useDebounce(searchValue, 400);

  // Sync debounced search to the active store
  React.useEffect(() => {
    if (activeTab === "patients") {
      setPatientSearch(debouncedSearch);
    } else {
      setInvestigationSearch(debouncedSearch);
    }
  }, [debouncedSearch, activeTab, setPatientSearch, setInvestigationSearch]);

  // Sync local input with store if changed externally (like on reset)
  React.useEffect(() => {
    if (currentStoreSearch === "" && searchValue !== "") {
      setSearchValue("");
    }
  }, [currentStoreSearch]);

  const handleClear = () => {
    setSearchValue("");
    if (activeTab === "patients") setPatientSearch("");
    else setInvestigationSearch("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input Container */}
        <div 
          className={`
            relative flex-1 w-full h-14 bg-white border rounded-2xl
            transition-all duration-300 ease-out shadow-sm
            ${isFocused 
              ? "border-fnh-blue ring-4 ring-fnh-blue/5 shadow-md" 
              : "border-slate-200 hover:border-slate-300"
            }
            ${disabled ? "opacity-60 pointer-events-none" : ""}
          `}
        >
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-fnh-blue" : ""}`} />
          </div>
          
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              activeTab === "patients" 
                ? "Search patients by name, phone or email..." 
                : "Search investigations by test number, patient or phone..."
            }
            className="w-full h-full pl-14 pr-12 bg-transparent border-0 focus:ring-0 text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
            disabled={disabled}
          />

          {searchValue && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Buttons Group */}
        <div className="flex items-center gap-2 h-14 w-full sm:w-auto">
          {activeTab === "investigations" && (
            <div className="h-full">
              <FilterTriggerButton disabled={disabled} />
            </div>
          )}
          
          <div className="h-full">
            <DateRangePill disabled={disabled} />
          </div>

          <div className="h-full">
            <ReportTriggerButton 
              disabled={disabled} 
              recordCount={recordCount} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfertilitySearch;
