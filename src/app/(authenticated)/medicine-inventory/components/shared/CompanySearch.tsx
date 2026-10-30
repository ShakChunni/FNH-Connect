/**
 * Company Search Component
 * Searchable dropdown for selecting pharmaceutical companies with inline add capability
 */

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientPortal } from "@/components/ui/ClientPortal";
import { Building2, Loader2, PlusCircle, X, Check } from "lucide-react";
import { useFetchMedicineCompanies } from "../../hooks";
import type { MedicineCompany } from "../../types";

interface CompanySearchProps {
  value: number | null;
  displayValue: string;
  onChange: (company: MedicineCompany | null) => void;
  onAddNew?: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({
  value,
  displayValue,
  onChange,
  onAddNew,
  placeholder = "Search company...",
  disabled = false,
  error = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(displayValue);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync search query with display value from parent
  useEffect(() => {
    if (displayValue !== searchQuery && !isOpen) {
      setSearchQuery(displayValue);
    }
  }, [displayValue, isOpen]);

  // Fetch companies with search
  const {
    data: companies = [],
    isLoading,
    isError,
    refetch,
  } = useFetchMedicineCompanies(
    true,
    isOpen ? searchQuery : undefined,
  );

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const query = searchQuery.toLowerCase().trim();
    return companies.filter((c) => c.name.toLowerCase().includes(query));
  }, [companies, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    // Clear selection when typing
    if (value) {
      onChange(null);
    }
  };

  const handleSelectCompany = (company: MedicineCompany) => {
    onChange(company);
    setSearchQuery(company.name);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (onAddNew && searchQuery.trim()) {
      onAddNew(searchQuery.trim());
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset to display value if nothing was selected
        if (!value) {
          setSearchQuery(displayValue);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, displayValue]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();

    const handleScrollResize = () => {
      if (isOpen) updateDropdownPosition();
    };

    window.addEventListener("scroll", handleScrollResize, true);
    window.addEventListener("resize", handleScrollResize);

    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, [isOpen, updateDropdownPosition]);

  const inputClassName = useMemo(() => {
    const base =
      "text-slate-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 pr-10 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm transition-colors placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";

    if (disabled) {
      return `${base} bg-slate-200 border-2 border-slate-300 cursor-not-allowed`;
    }

    if (error) {
      return `${base} bg-red-50 border-2 border-red-500 cursor-pointer`;
    }

    if (value) {
      return `${base} bg-white border-2 border-emerald-600 cursor-pointer`;
    }

    return `${base} bg-white border-2 border-slate-300 cursor-pointer`;
  }, [disabled, error, value]);

  const showNoResults =
    isOpen &&
    !isLoading &&
    filteredCompanies.length === 0 &&
    searchQuery.trim().length > 0;
  const showResults = isOpen && filteredCompanies.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchQuery.length >= 1 || companies.length > 0) {
              updateDropdownPosition();
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClassName} pl-10`}
        />
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
        {!value && searchQuery && !disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="w-4 h-4 text-emerald-500 opacity-0" />
          </div>
        )}
      </div>

      {/* Dropdown Portal */}
      {isOpen && (
        <ClientPortal>
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[100001]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: "280px",
              }}
            >
              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  <span className="ml-2 text-sm text-slate-500">
                    Searching...
                  </span>
                </div>
              )}

              {/* Results */}
              {showResults && (
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelectCompany(company)}
                      className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 cursor-pointer ${
                        value === company.id ? "bg-emerald-50" : ""
                      }`}
                    >
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {company.name}
                        </p>
                        {company.address && (
                          <p className="text-xs text-slate-500 truncate">
                            {company.address}
                          </p>
                        )}
                      </div>
                      {value === company.id && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Load failed */}
              {isError && (
                <div role="alert" className="p-4 text-center">
                  <p className="text-sm font-medium text-red-700">
                    Could not load companies.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* No Results + Add New */}
              {showNoResults && !isError && (
                <div className="p-4">
                  <p className="text-sm text-slate-500 mb-3 text-center">
                    No companies found for &quot;{searchQuery}&quot;
                  </p>
                  {onAddNew && (
                    <button
                      onClick={handleAddNew}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm font-semibold text-emerald-700">
                        Add &quot;{searchQuery}&quot; as new company
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Add Option at Bottom */}
              {showResults && onAddNew && searchQuery.trim() && (
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={handleAddNew}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-semibold text-emerald-700">
                      Add new company
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ClientPortal>
      )}
    </div>
  );
};

export default CompanySearch;
