import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { User, Loader2, PlusCircle, X, UserCheck } from "lucide-react";
import {
  useFetchPathologyPatients,
  PathologyPatientBasic,
} from "../hooks/useFetchPathologyPatients";
import {
  usePathologyPatientData,
  usePathologyGuardianData,
  usePathologyHospitalData,
  usePathologyActions,
} from "../../../app/(staff)/pathology/stores";

const PathologyPatientSearch: React.FC = () => {
  const patientData = usePathologyPatientData();
  const guardianData = usePathologyGuardianData();
  const hospitalData = usePathologyHospitalData();
  const { setPatientData, setGuardianData } = usePathologyActions();

  const [searchQuery, setSearchQueryState] = useState(
    patientData.fullName || ""
  );
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Sync with store
  useEffect(() => {
    if (patientData.fullName && patientData.fullName !== searchQuery) {
      setSearchQueryState(patientData.fullName);
    }
  }, [patientData.fullName, searchQuery]);

  const {
    data: patients = [],
    isLoading: loading,
    error,
  } = useFetchPathologyPatients(searchQuery);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientStatus, setPatientStatus] = useState<"" | "filled" | "new">("");

  // Determine status from data
  useEffect(() => {
    if (patientData.id) {
      setPatientStatus("filled");
    } else if (searchQuery.length > 1 && !patientData.id) {
      setPatientStatus("new");
    } else {
      setPatientStatus("");
    }
  }, [patientData.id, searchQuery]);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
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
            : ` bg-white border-2 border-gray-300`;
        }
      }
      return style;
    };
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (nameInputRef.current) {
      const rect = nameInputRef.current.getBoundingClientRect();
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

    // Auto-update first/last name
    const names = newQuery.trim().split(" ");
    setPatientData({
      ...patientData,
      id: null,
      fullName: newQuery,
      firstName: names[0] || "",
      lastName: names.slice(1).join(" ") || "",
      gender: "", // Reset gender for new patient
    });

    // Also reset guardian data for new patient
    setGuardianData({
      name: "",
      age: null,
      dateOfBirth: null,
      gender: "",
    });

    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  const handleSelectPatient = (patient: PathologyPatientBasic) => {
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    const spouseDOB = patient.spouseDOB ? new Date(patient.spouseDOB) : null;

    // Set patient data with all available info
    setPatientData({
      id: patient.id,
      firstName:
        patient.firstName || patient.patientFullName.split(" ")[0] || "",
      lastName:
        patient.lastName ||
        patient.patientFullName.split(" ").slice(1).join(" ") ||
        "",
      fullName: patient.patientFullName,
      gender: patient.patientGender || "",
      age: patient.patientAge,
      dateOfBirth: dob,
      address: patient.address || "",
      phoneNumber: patient.mobileNumber || "",
      email: patient.email || "",
      guardianName: patient.guardianName || "",
      bloodGroup: patient.bloodGroup || "",
    });

    // Set guardian data - autofill from guardianName in patient record
    // For pathology, this is guardian info (not spouse)
    setGuardianData({
      name: patient.guardianName || "",
      age: null, // Not stored in patient record
      dateOfBirth: spouseDOB, // Use spouseDOB if available (could be guardian DOB)
      gender: "", // Not stored in patient record
    });

    setSearchQuery(patient.patientFullName);
    setIsDropdownOpen(false);
  };

  const handleAddNew = () => {
    setIsDropdownOpen(false);
    // Data already set via input change
  };

  const handleClearSelection = () => {
    setPatientData({
      id: null,
      firstName: "",
      lastName: "",
      fullName: "",
      gender: "", // No default gender for pathology
      age: null,
      dateOfBirth: null,
      guardianName: "",
      address: "",
      phoneNumber: "",
      email: "",
      bloodGroup: "",
    });
    setGuardianData({
      name: "",
      age: null,
      dateOfBirth: null,
      gender: "",
    });
    setSearchQuery("");
  };

  // Close logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  const isPatientSelected = !!patientData.id;

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
          >
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              {loading && (
                <div className="flex items-center justify-center p-4 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </div>
              )}
              {!loading && patients.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-500" />
                      Existing Patients
                    </p>
                  </div>
                  {patients.map((patient) => (
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
                          {patient.patientFullName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Phone: {patient.mobileNumber || "N/A"}</span>
                          {patient.guardianName && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Guardian: {patient.guardianName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {!loading &&
                searchQuery.length > 1 &&
                !patients.some(
                  (p) =>
                    p.patientFullName.toLowerCase() ===
                    searchQuery.toLowerCase()
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
    ]
  );

  return (
    <>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold">
          Patient Full Name<span className="text-red-500">*</span>
        </label>
        <div className="sm:hidden">
          {patientStatus === "new" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
              <PlusCircle className="w-3 h-3 mr-1 text-indigo-500" />
              New
            </span>
          )}
          {patientStatus === "filled" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
              <User className="w-3 h-3 mr-1 text-indigo-500" />
              Auto-filled
            </span>
          )}
        </div>
      </div>
      <div className="relative flex items-center mb-3 sm:mb-4">
        <input
          ref={nameInputRef}
          type="text"
          className={
            inputClassName(patientData.fullName, true, isPatientSelected) +
            " pr-10"
          }
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isPatientSelected && searchQuery.length >= 0) {
              updateDropdownPosition();
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Search by patient name or mobile number..."
          readOnly={isPatientSelected}
          autoComplete="off"
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
        <div className="hidden sm:flex absolute right-10 top-1/2 -translate-y-1/2 flex-row gap-2">
          {patientStatus === "new" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none whitespace-nowrap">
              <PlusCircle className="w-3 h-3 mr-1 text-indigo-500" />
              Adding as a new patient
            </span>
          )}
        </div>
      </div>
      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default PathologyPatientSearch;
