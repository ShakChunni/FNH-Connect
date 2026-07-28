"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfertilityFilterStore } from "../stores/filterStore";
import { useInfertilityTestFilterStore } from "../stores/testFilterStore";
import {
  PatientReportTriggerButton,
  InvestigationReportTriggerButton,
  FilterTriggerButton,
} from "./filter";

interface InfertilitySearchProps {
  disabled?: boolean;
  recordCount?: number;
  activeTab: "patients" | "investigations";
}

/**
 * HSI Center Search Component
 * Adaptive search bar that switches between Patient and Investigation stores
 */
export const InfertilitySearch: React.FC<InfertilitySearchProps> = ({
  disabled = false,
  recordCount = 0,
  activeTab,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const activeTabRef = React.useRef(activeTab);

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
    if (activeTabRef.current !== activeTab) {
      activeTabRef.current = activeTab;
      return;
    }

    if (activeTab === "patients") {
      setPatientSearch(debouncedSearch);
    } else {
      setInvestigationSearch(debouncedSearch);
    }
  }, [debouncedSearch, activeTab, setPatientSearch, setInvestigationSearch]);

  // Keep tab-specific searches isolated and respond to drawer resets.
  React.useEffect(() => {
    setSearchValue(currentStoreSearch);
  }, [activeTab, currentStoreSearch]);

  const handleClear = () => {
    setSearchValue("");
    if (activeTab === "patients") setPatientSearch("");
    else setInvestigationSearch("");
  };

  const reportButton =
    activeTab === "patients" ? (
      <PatientReportTriggerButton
        disabled={disabled}
        recordCount={recordCount}
      />
    ) : (
      <InvestigationReportTriggerButton
        disabled={disabled}
        recordCount={recordCount}
      />
    );

  const searchInput = (mobile: boolean) => (
    <div
      className={`relative flex w-full flex-1 items-center rounded-full border bg-white shadow-sm transition-all duration-300 ${
        mobile ? "h-11" : "h-14"
      } ${
        isFocused
          ? "border-emerald-600 ring-4 ring-emerald-600/5 shadow-md"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <Search
        className={`pointer-events-none absolute ${
          mobile ? "left-3 h-4 w-4" : "left-4 h-5 w-5"
        } ${isFocused ? "text-emerald-600" : "text-slate-400"}`}
      />
      <input
        type="text"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={
          activeTab === "patients"
            ? "Search patients by name, phone or email..."
            : "Search investigations by test number, patient or phone..."
        }
        className={`h-full w-full rounded-full border-0 bg-transparent pr-11 text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0 ${
          mobile
            ? "pl-10 text-xs placeholder:text-xs"
            : "pl-12 text-base placeholder:text-sm"
        }`}
        disabled={disabled}
      />
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-col gap-3 sm:hidden">
        {searchInput(true)}
        <div className="flex w-full gap-2">
          <div className="h-11 flex-1">{reportButton}</div>
          <div className="h-11 flex-1">
            <FilterTriggerButton scope={activeTab} />
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        {searchInput(false)}
        <div className="flex h-14 shrink-0 items-center">{reportButton}</div>
        <div className="flex h-14 shrink-0 items-center">
          <FilterTriggerButton scope={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default InfertilitySearch;
