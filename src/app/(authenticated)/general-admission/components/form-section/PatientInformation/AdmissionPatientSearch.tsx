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
import { DURATION, tween } from "@/lib/motion";
import { TONE_BADGE } from "@/lib/statusStyles";
import { User, PlusCircle, Loader2, X, MapPin } from "lucide-react";
import { useAdmissionPatientData, useAdmissionActions } from "../../../stores";
import { useFetchPatients } from "../../../hooks";
import type { Patient } from "../../../types";
import {
  getAgeInYearsFromDateOfBirth,
  parseDateOfBirth,
} from "@/lib/dateOfBirth";

const AdmissionPatientSearch: React.FC = () => {
  const patientData = useAdmissionPatientData();
  const { setPatientData } = useAdmissionActions();

  const [searchQuery, setSearchQueryState] = useState(
    patientData.fullName || "",
  );
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Use the extracted hook
  const { data: patients = [], isLoading: loading, error: searchError } =
    useFetchPatients(searchQuery);

  useEffect(() => {
    if (patientData.fullName !== searchQuery) {
      setSearchQueryState(patientData.fullName || "");
    }
  }, [patientData.fullName]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientStatus, setPatientStatus] = useState<"" | "existing" | "new">(
    "",
  );

  useEffect(() => {
    if (patientData.id) {
      setPatientStatus("existing");
    } else if (patientData.firstName && patientData.firstName.length > 0) {
      setPatientStatus("new");
    } else {
      setPatientStatus("");
    }
  }, [patientData.id, patientData.firstName]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-slate-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-indigo-900 focus:ring-2 focus:ring-indigo-950 outline-none shadow-sm transition-colors placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string,
      isValid: boolean = true,
      disabled: boolean = false,
    ) => {
      let style = disabled
        ? `bg-slate-200 border-2 border-slate-300 cursor-not-allowed ${baseStyle}`
        : baseStyle;
      if (!disabled) {
        if (!isValid && value) {
          style = `bg-red-50 border-2 border-red-500 ${baseStyle}`;
        } else {
          style += value
            ? ` bg-white border-2 border-green-700`
            : ` bg-slate-50 border-2 border-slate-300`;
        }
      }
      return style;
    };
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (patientInputRef.current) {
      const rect = patientInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);

    // Parse first and last name
    const parts = newQuery.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    setPatientData({
      id: null,
      firstName,
      lastName,
      fullName: newQuery,
      gender: "",
      age: null,
      dateOfBirth: null,
      address: "",
      phoneNumber: "",
      email: "",
      bloodGroup: "",
      guardianName: "",
      guardianPhone: "",
    });

    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
      setPatientStatus("new");
    } else {
      setIsDropdownOpen(false);
      setPatientStatus("");
    }
  };

  const handleSelectPatient = useCallback(
    (patient: Patient) => {
      const age = getAgeInYearsFromDateOfBirth(patient.dateOfBirth);

      setPatientData({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName || "",
        fullName: patient.fullName,
        gender: patient.gender,
        age,
        dateOfBirth: parseDateOfBirth(patient.dateOfBirth),
        address: patient.address || "",
        phoneNumber: patient.phoneNumber || "",
        email: patient.email || "",
        bloodGroup: patient.bloodGroup || "",
        guardianName: patient.guardianName || "",
        guardianPhone: patient.guardianPhone || "",
      });
      setSearchQuery(patient.fullName);
      setIsDropdownOpen(false);
      setPatientStatus("existing");
    },
    [setPatientData, setSearchQuery],
  );

  const handleAddNew = useCallback(() => {
    setIsDropdownOpen(false);
    setPatientStatus("new");
  }, []);

  const handleClearSelection = () => {
    setPatientData({
      id: null,
      firstName: "",
      lastName: "",
      fullName: "",
      gender: "",
      age: null,
      dateOfBirth: null,
      address: "",
      phoneNumber: "",
      email: "",
      bloodGroup: "",
      guardianName: "",
      guardianPhone: "",
    });
    setSearchQuery("");
    setPatientStatus("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (patientInputRef.current && patientInputRef.current.contains(target))
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  const isPatientSelected = patientData.id !== null;

  const dropdownContent = useMemo(
    () => (
      <AnimatePresence>
        {isDropdownOpen && !isPatientSelected && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tween(DURATION.fast)}
            className="bg-white border border-slate-300 rounded-lg shadow-lg z-100000 overflow-hidden"
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: "300px",
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              {loading && (
                <div className="flex items-center justify-center p-4 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </div>
              )}
              {!loading &&
                patients.length > 0 &&
                patients.map((patient) => (
                  <div
                    key={patient.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectPatient(patient);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-100 last:border-b-0"
                  >
                    <User className="w-5 h-5 text-slate-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {patient.gender}
                        {patient.phoneNumber ? ` • ${patient.phoneNumber}` : ""}
                      </p>
                      {patient.address ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 break-words">
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="whitespace-normal">
                            {patient.address}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              {!loading && searchError ? (
                <div className="px-4 py-3 text-xs text-red-600 border-t border-slate-200">
                  Unable to search patients. Please try again.
                </div>
              ) : null}
              {!loading &&
                !searchError &&
                searchQuery.length >= 1 &&
                !patients.some(
                  (p) => p.fullName.toLowerCase() === searchQuery.toLowerCase(),
                ) && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddNew();
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 border-t border-slate-200"
                  >
                    <PlusCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                    <p className="font-medium text-indigo-700 text-sm">
                      Add &quot;{searchQuery}&quot; as a new patient
                    </p>
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    [
      isDropdownOpen,
      isPatientSelected,
      dropdownPosition,
      loading,
      patients,
      searchQuery,
      searchError,
      handleSelectPatient,
      handleAddNew,
    ],
  );

  return (
    <>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label className="block text-slate-700 text-sm sm:text-base font-semibold">
          Patient Name<span className="text-red-600">*</span>
        </label>
        {patientStatus === "new" && (
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${TONE_BADGE.info}`}>
            <PlusCircle className="w-3 h-3 mr-1 text-blue-600" />
            New
          </span>
        )}
        {patientStatus === "existing" && (
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${TONE_BADGE.info}`}>
            <User className="w-3 h-3 mr-1 text-indigo-500" />
            Auto-filled
          </span>
        )}
      </div>

      <div className="relative flex items-center mb-3 sm:mb-4">
        <input
          ref={patientInputRef}
          type="text"
          className={
            inputClassName(searchQuery, searchQuery.trim() !== "") + " pr-12"
          }
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isPatientSelected && searchQuery.length >= 0) {
              updateDropdownPosition();
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Search by patient name, phone or address..."
          readOnly={isPatientSelected}
        />
        {isPatientSelected && (
          <button
            onClick={handleClearSelection}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <ClientPortal>
        {dropdownContent}
      </ClientPortal>
    </>
  );
};

export default AdmissionPatientSearch;
