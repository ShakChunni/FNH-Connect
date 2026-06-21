/**
 * Patient Search Component
 * Searchable dropdown for selecting patients for medicine sales.
 *
 * Surfaces the additional fields the central `/api/patient-records`
 * endpoint returns (phone, address, guardian, gender) so pharmacists
 * can confidently distinguish patients with similar names.
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
import {
  User,
  Loader2,
  X,
  Check,
  Phone,
  MapPin,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";
import type { SalePatientOption } from "../../types";

interface PatientSearchProps {
  value: number | null;
  displayValue: string;
  displayPhone?: string;
  onChange: (patient: SalePatientOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

function useFetchPatients(searchQuery: string) {
  const debouncedQuery = useDebounce(searchQuery || "", 150);

  return useQuery({
    queryKey: ["patients", "search", debouncedQuery],
    queryFn: async (): Promise<SalePatientOption[]> => {
      if (
        !debouncedQuery ||
        !debouncedQuery.trim() ||
        debouncedQuery.trim().length < 2
      ) {
        return [];
      }

      const response = await api.get<{
        success: boolean;
        data: Array<{
          id: number;
          fullName: string;
          phoneNumber: string | null;
          gender: string;
          guardianName?: string | null;
          address?: string | null;
          email?: string | null;
        }>;
        error?: string;
      }>("/patient-records", {
        params: {
          search: debouncedQuery.trim(),
        },
        timeout: 5000,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch patients");
      }

      return (response.data.data || []).slice(0, 10).map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        guardianName: patient.guardianName ?? null,
        address: patient.address ?? null,
        email: patient.email ?? null,
      }));
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000,
    gcTime: 60000,
  });
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  displayValue,
  displayPhone,
  onChange,
  placeholder = "Search by name, phone, guardian or address...",
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

  // Fetch patients with search
  const {
    data: patients = [],
    isLoading,
    isError,
    error: searchError,
  } = useFetchPatients(isOpen ? searchQuery : "");

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery.length >= 2) {
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

  const handleSelectPatient = (patient: SalePatientOption) => {
    onChange(patient);
    setSearchQuery(patient.fullName);
    setIsOpen(false);
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
    let base =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 pr-10 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";

    if (disabled) {
      return `${base} bg-gray-200 border-2 border-gray-300 cursor-not-allowed`;
    }

    if (error) {
      return `${base} bg-red-50 border-2 border-red-500 cursor-pointer`;
    }

    if (value) {
      return `${base} bg-white border-2 border-green-600 cursor-pointer`;
    }

    return `${base} bg-white border-2 border-gray-300 cursor-pointer`;
  }, [disabled, error, value]);

  const showNoResults =
    isOpen &&
    !isLoading &&
    patients.length === 0 &&
    searchQuery.trim().length >= 2;
  const showResults = isOpen && patients.length > 0;
  const showHint =
    isOpen && !isLoading && searchQuery.trim().length < 2 && !value;

  return (
    <div className="relative">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchQuery.length >= 2) {
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
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Show extra context when patient is selected */}
      {value && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {displayPhone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{displayPhone}</span>
            </span>
          )}
        </div>
      )}

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
              className="fixed bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[100001]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: "280px",
              }}
            >
              {/* Hint to type more */}
              {showHint && (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Type at least 2 characters to search
                  </p>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">
                    Searching patients...
                  </span>
                </div>
              )}

              {/* Results */}
              {showResults && (
                <div className="max-h-[300px] overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-start gap-3 cursor-pointer ${
                        value === patient.id ? "bg-indigo-50" : ""
                      }`}
                    >
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {patient.fullName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          <span className="text-[11px] text-gray-500 font-medium">
                            {patient.gender}
                          </span>
                          {patient.phoneNumber && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                              <Phone className="w-2.5 h-2.5" />
                              {patient.phoneNumber}
                            </span>
                          )}
                          {patient.guardianName && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                              <Users className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[120px]">
                                {patient.guardianName}
                              </span>
                            </span>
                          )}
                        </div>
                        {patient.address && (
                          <p className="inline-flex items-start gap-0.5 text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            <MapPin className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                            <span className="truncate">{patient.address}</span>
                          </p>
                        )}
                      </div>
                      {value === patient.id && (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {isOpen && isError && (
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-red-600">
                    {searchError instanceof Error
                      ? searchError.message
                      : "Failed to search patients"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Check the connection and try again.
                  </p>
                </div>
              )}

              {/* No Results */}
              {showNoResults && !isError && (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">
                    No patients found for "{searchQuery}"
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Make sure the patient is registered in the system
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ClientPortal>
      )}
    </div>
  );
};

export default PatientSearch;
