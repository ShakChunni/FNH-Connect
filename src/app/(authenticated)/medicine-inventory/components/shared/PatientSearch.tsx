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
  Hash,
  Stethoscope,
  LogOut,
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

interface PatientSearchFilters {
  gyneOnly: boolean;
  dischargedOnly: boolean;
}

function useFetchPatients(
  searchQuery: string,
  filters: PatientSearchFilters,
  isOpen: boolean,
) {
  const debouncedQuery = useDebounce(searchQuery || "", 150);
  const canSearch =
    debouncedQuery.trim().length >= 2 ||
    filters.gyneOnly ||
    filters.dischargedOnly;

  return useQuery({
    queryKey: [
      "patients",
      "search",
      debouncedQuery,
      filters.gyneOnly,
      filters.dischargedOnly,
    ],
    queryFn: async (): Promise<SalePatientOption[]> => {
      if (!canSearch) {
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
          admissions?: Array<{
            id: number;
            admissionNumber: string;
          }>;
        }>;
        error?: string;
      }>("/patient-records", {
        params: {
          search: debouncedQuery.trim() || undefined,
          gyneOnly: filters.gyneOnly || undefined,
          dischargedOnly: filters.dischargedOnly || undefined,
          limit: 10,
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
        matchedAdmissionNumber:
          patient.admissions?.[0]?.admissionNumber ?? null,
      }));
    },
    enabled: isOpen && canSearch,
    staleTime: 30000,
    gcTime: 60000,
  });
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  displayValue,
  displayPhone,
  onChange,
  placeholder = "Search by name, phone, or admission ID...",
  disabled = false,
  error = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(displayValue);
  const [isOpen, setIsOpen] = useState(false);
  const [gyneOnly, setGyneOnly] = useState(false);
  const [dischargedOnly, setDischargedOnly] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const searchControlsRef = useRef<HTMLDivElement>(null);
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
  } = useFetchPatients(
    searchQuery,
    {
      gyneOnly,
      dischargedOnly,
    },
    isOpen,
  );

  const updateDropdownPosition = useCallback(() => {
    if (searchControlsRef.current) {
      const rect = searchControlsRef.current.getBoundingClientRect();
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
    if (newQuery.trim().length >= 2 || gyneOnly || dischargedOnly) {
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

  const handleFilterChange = (filter: keyof PatientSearchFilters) => {
    if (disabled) return;

    if (filter === "gyneOnly") {
      setGyneOnly((current) => !current);
    } else {
      setDischargedOnly((current) => !current);
    }

    updateDropdownPosition();
    setIsOpen(true);
  };

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchControlsRef.current &&
        !searchControlsRef.current.contains(event.target as Node) &&
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
    const base =
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
    (searchQuery.trim().length >= 2 || gyneOnly || dischargedOnly);
  const showResults = isOpen && patients.length > 0;
  const showHint =
    isOpen &&
    !isLoading &&
    searchQuery.trim().length < 2 &&
    !gyneOnly &&
    !dischargedOnly &&
    !value;

  return (
    <div className="relative">
      <div ref={searchControlsRef} className="space-y-2.5">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery.length >= 2 || gyneOnly || dischargedOnly) {
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
              aria-label="Clear selected patient"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <motion.button
            type="button"
            onClick={() => handleFilterChange("gyneOnly")}
            disabled={disabled}
            aria-pressed={gyneOnly}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold transition-colors sm:min-h-0 sm:px-3 sm:text-xs ${
              gyneOnly
                ? "border-pink-200 bg-pink-50 text-pink-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
            <span>Gyne patients</span>
            <AnimatePresence initial={false}>
              {gyneOnly && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-white"
                >
                  <Check className="h-2.5 w-2.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => handleFilterChange("dischargedOnly")}
            disabled={disabled}
            aria-pressed={dischargedOnly}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold transition-colors sm:min-h-0 sm:px-3 sm:text-xs ${
              dischargedOnly
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Discharged</span>
            <AnimatePresence initial={false}>
              {dischargedOnly && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white"
                >
                  <Check className="h-2.5 w-2.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
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
      <ClientPortal>
        <AnimatePresence>
          {isOpen && (
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
                          {patient.matchedAdmissionNumber && (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <Hash className="w-2.5 h-2.5" />
                              {patient.matchedAdmissionNumber}
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
                    {searchQuery.trim()
                      ? `No patients found for "${searchQuery}"`
                      : "No patients match the selected filters"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Make sure the patient is registered in the system
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ClientPortal>
    </div>
  );
};

export default PatientSearch;
