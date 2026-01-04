"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { User, PlusCircle, Loader2, X } from "lucide-react";
import { useAdmissionPatientData, useAdmissionActions } from "../../../stores";
import { useFetchPatients } from "../../../hooks";
import type { Patient } from "../../../types";

const AdmissionPatientSearch: React.FC = () => {
  const patientData = useAdmissionPatientData();
  const { setPatientData } = useAdmissionActions();

  const [searchQuery, setSearchQueryState] = useState(
    patientData.fullName || ""
  );
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Use the extracted hook
  const { data: patients = [], isLoading: loading } =
    useFetchPatients(searchQuery);

  useEffect(() => {
    if (patientData.fullName !== searchQuery) {
      setSearchQueryState(patientData.fullName || "");
    }
  }, [patientData.fullName]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientStatus, setPatientStatus] = useState<"" | "existing" | "new">(
    ""
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
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-indigo-900 focus:ring-2 focus:ring-indigo-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string,
      isValid: boolean = true,
      disabled: boolean = false
    ) => {
      let style = disabled
        ? `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`
        : baseStyle;
      if (!disabled) {
        if (!isValid && value) {
          style = `bg-red-50 border-2 border-red-500 ${baseStyle}`;
        } else {
          style += value
            ? ` bg-white border-2 border-green-700`
            : ` bg-gray-50 border-2 border-gray-300`;
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
      const age = patient.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(patient.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null;

      setPatientData({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName || "",
        fullName: patient.fullName,
        gender: patient.gender,
        age,
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
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
    [setPatientData, setSearchQuery]
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
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white border border-gray-300 rounded-lg shadow-2xl z-100000 overflow-hidden"
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
                <div className="flex items-center justify-center p-4 text-gray-500">
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
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <User className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm truncate">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {patient.gender}
                        {patient.phoneNumber ? ` • ${patient.phoneNumber}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              {!loading &&
                searchQuery.length >= 1 &&
                !patients.some(
                  (p) => p.fullName.toLowerCase() === searchQuery.toLowerCase()
                ) && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddNew();
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 border-t border-gray-200"
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
      handleSelectPatient,
      handleAddNew,
    ]
  );

  return (
    <>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold">
          Patient Name<span className="text-red-500">*</span>
        </label>
        {patientStatus === "new" && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
            <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
            New
          </span>
        )}
        {patientStatus === "existing" && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
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
            inputClassName(searchQuery, searchQuery.trim() !== "") + " pr-10"
          }
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isPatientSelected && searchQuery.length >= 0) {
              updateDropdownPosition();
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Search for existing patient or type new name..."
          readOnly={isPatientSelected}
        />
        {isPatientSelected && (
          <button
            onClick={handleClearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default AdmissionPatientSearch;
