import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  PlusCircle,
  Building2,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { useFetchPatientInformation } from "../hooks";
import DateOfBirthDropdown from "../../Dropdowns/DobDropdown";
import GenderDropdown from "../../Dropdowns/GenderDropdown";
import ContactEmailInput from "./ContactEmailInput";
import ContactPhoneInput from "./ContactPhoneInput";
import type { PatientData, InfertilityPatientBasic } from "../../../types";

interface PatientInformationProps {
  onDataChange: (data: PatientData) => void;
  availablePatients: InfertilityPatientBasic[];
  onDropdownToggle: (isOpen: boolean) => void;
  isMobile: boolean;
  onValidationChange: (isValid: { phone: boolean; email: boolean }) => void;
  hospitalName: string;
}

const PatientInformation: React.FC<PatientInformationProps> = ({
  onDataChange,
  availablePatients,
  onDropdownToggle,
  isMobile,
  onValidationChange,
  hospitalName,
}) => {
  const [searchQuery, setSearchQueryState] = useState("");
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const {
    data: patients = [],
    isLoading: loading,
    error,
  } = useFetchPatientInformation(searchQuery);

  useEffect(() => {
    if (error) {
      console.error("Patient search error:", error);
    }
  }, [error]);

  const [localData, setLocalData] = useState<PatientData>({
    id: null,
    firstName: "",
    lastName: "",
    fullName: "",
    gender: "Female",
    age: null,
    dateOfBirth: null,
    guardianName: "",
    address: "",
    phoneNumber: "",
    email: "",
    bloodGroup: "",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const [patientStatus, setPatientStatus] = useState<
    "" | "hospital-filled" | "global-filled" | "new"
  >("");
  const [patientTouched, setPatientTouched] = useState(false);
  const [autofilledFields, setAutofilledFields] = useState<{
    phoneNumber: boolean;
    email: boolean;
    address: boolean;
    age: boolean;
    dateOfBirth: boolean;
  }>({
    phoneNumber: false,
    email: false,
    address: false,
    age: false,
    dateOfBirth: false,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset patient form when hospital changes
  const availablePatientsLength = availablePatients.length;
  useEffect(() => {
    setLocalData({
      id: null,
      firstName: "",
      lastName: "",
      fullName: "",
      gender: "Female",
      age: null,
      dateOfBirth: null,
      guardianName: "",
      address: "",
      phoneNumber: "",
      email: "",
      bloodGroup: "",
    });
    setIsDropdownOpen(false);
    setSearchQuery("");
    setPatientStatus("");
    setPatientTouched(false);
    setAutofilledFields({
      phoneNumber: false,
      email: false,
      address: false,
      age: false,
      dateOfBirth: false,
    });
    onDropdownToggle(false);
  }, [availablePatientsLength, onDropdownToggle, setSearchQuery]);

  // Update full name when first/last name changes
  useEffect(() => {
    const fullName = `${localData.firstName} ${localData.lastName}`.trim();
    if (fullName !== localData.fullName) {
      setLocalData((prev) => ({ ...prev, fullName: fullName }));
    }
  }, [localData.firstName, localData.lastName, localData.fullName]);

  // Lift state up when local data changes
  useEffect(() => {
    onDataChange(localData);
  }, [localData, onDataChange]);

  // Lift validation state up
  useEffect(() => {
    onValidationChange({ phone: isPhoneValid, email: isEmailValid });
  }, [isPhoneValid, isEmailValid, onValidationChange]);

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

  // Autofill selection from hospital patients
  const handleSelectHospitalPatient = (patient: InfertilityPatientBasic) => {
    setLocalData({
      id: patient.id,
      firstName: patient.patientFullName.split(" ")[0] || "",
      lastName: patient.patientFullName.split(" ").slice(1).join(" ") || "",
      fullName: patient.patientFullName,
      gender: "Female",
      age: patient.patientAge,
      dateOfBirth: null,
      guardianName: "",
      address: "",
      phoneNumber: patient.mobileNumber || "",
      email: patient.email || "",
      bloodGroup: "",
    });
    setSearchQuery(patient.patientFullName);
    setIsDropdownOpen(false);
    onDropdownToggle(false);
    setPatientTouched(true);
    setPatientStatus("hospital-filled");
    setAutofilledFields({
      phoneNumber: !!patient.mobileNumber,
      email: !!patient.email,
      address: false,
      age: !!patient.patientAge,
      dateOfBirth: false,
    });
  };

  const handleSelectGlobalPatient = (patient: InfertilityPatientBasic) => {
    setLocalData({
      id: patient.id,
      firstName: patient.patientFullName.split(" ")[0] || "",
      lastName: patient.patientFullName.split(" ").slice(1).join(" ") || "",
      fullName: patient.patientFullName,
      gender: "Female",
      age: patient.patientAge,
      dateOfBirth: null,
      guardianName: "",
      address: "",
      phoneNumber: patient.mobileNumber || "",
      email: patient.email || "",
      bloodGroup: "",
    });
    setSearchQuery(patient.patientFullName);
    setIsDropdownOpen(false);
    onDropdownToggle(false);
    setPatientTouched(true);
    setPatientStatus("global-filled");
    setAutofilledFields({
      phoneNumber: !!patient.mobileNumber,
      email: !!patient.email,
      address: false,
      age: !!patient.patientAge,
      dateOfBirth: false,
    });
  };

  // Add new patient
  const handleAddNew = useCallback(() => {
    const names = searchQuery.trim().split(" ");
    setLocalData((prev) => ({
      ...prev,
      id: null,
      firstName: names[0] || "",
      lastName: names.slice(1).join(" ") || "",
      fullName: searchQuery.trim(),
    }));
    setIsDropdownOpen(false);
    onDropdownToggle(false);
    setPatientStatus("new");
    setPatientTouched(true);
    setAutofilledFields({
      phoneNumber: false,
      email: false,
      address: false,
      age: false,
      dateOfBirth: false,
    });
  }, [searchQuery, onDropdownToggle]);

  // Clear selection
  const handleClearSelection = () => {
    setLocalData({
      id: null,
      firstName: "",
      lastName: "",
      fullName: "",
      gender: "Female",
      age: null,
      dateOfBirth: null,
      guardianName: "",
      address: "",
      phoneNumber: "",
      email: "",
      bloodGroup: "",
    });
    setSearchQuery("");
    setPatientStatus("");
    setPatientTouched(false);
    setAutofilledFields({
      phoneNumber: false,
      email: false,
      address: false,
      age: false,
      dateOfBirth: false,
    });
  };

  // Handle name change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    const names = newQuery.trim().split(" ");
    setLocalData((prev) => ({
      ...prev,
      firstName: names[0] || "",
      lastName: names.slice(1).join(" ") || "",
      fullName: newQuery,
    }));
    setPatientTouched(true);
    if (
      (patientStatus === "hospital-filled" ||
        patientStatus === "global-filled") &&
      newQuery !== localData.fullName
    ) {
      setLocalData((prev) => ({
        ...prev,
        id: null,
        phoneNumber: "",
        email: "",
        address: "",
        age: null,
        dateOfBirth: null,
      }));
      setPatientStatus("new");
      setAutofilledFields({
        phoneNumber: false,
        email: false,
        address: false,
        age: false,
        dateOfBirth: false,
      });
    }
    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
      onDropdownToggle(true);
    } else {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
      setPatientStatus("");
    }
  };

  const handleInputFocus = () => {
    updateDropdownPosition();
    setIsDropdownOpen(true);
    onDropdownToggle(true);
  };

  const handleInputBlur = () => {
    if (!searchQuery || !patientTouched) {
      setPatientStatus("");
      return;
    }
    if (localData.id) {
      // Keep existing status
    } else if (searchQuery.length > 1) {
      setPatientStatus("new");
    } else {
      setPatientStatus("");
    }
  };

  // Handle field changes
  const handleFieldChange = (
    field: keyof PatientData,
    value: string | number | Date | null
  ) => {
    setLocalData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (
      field in autofilledFields &&
      autofilledFields[field as keyof typeof autofilledFields]
    ) {
      setAutofilledFields((prev) => ({
        ...prev,
        [field]: false,
      }));
    }
  };

  // Handle DOB change
  const handleDOBChange = (
    date: Date | null,
    age?: { years: number; months: number; days: number }
  ) => {
    setLocalData((prev) => ({
      ...prev,
      dateOfBirth: date,
      age: age ? age.years : null,
    }));
  };

  const handleSpouseDOBChange = (
    date: Date | null,
    age?: { years: number; months: number; days: number }
  ) => {
    setLocalData((prev) => ({
      ...prev,
      guardianName: "", // This would be spouse name, but for now empty
    }));
  };

  // Enhanced click outside & scroll handler
  const handleScroll = useCallback(
    (event: Event) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!dropdownRef.current?.contains(target)) {
          setIsDropdownOpen(false);
          onDropdownToggle(false);
        }
      }
    },
    [isDropdownOpen, onDropdownToggle]
  );

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
        onDropdownToggle(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isDropdownOpen, onDropdownToggle, handleScroll]);

  const isPatientSelected = localData.id !== null;

  // Status message and dynamic header styling
  const getHeaderBg = () => {
    // Use indigo theme for Patient section (matches parent tab color)
    return "from-indigo-50 to-indigo-100 border-indigo-200";
  };

  const getDescription = () => {
    if (patientStatus === "hospital-filled") {
      return "Patient found in current hospital records. Details have been auto-filled.";
    }
    if (patientStatus === "global-filled") {
      return "Patient found in system from another hospital. Some details auto-filled.";
    }
    if (patientStatus === "new") {
      return "Creating new patient record. Please fill in all required details.";
    }
    return "Search for an existing patient or add a new patient to the system.";
  };

  // Input styling
  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
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

  const showHospitalPatients = availablePatients.length > 0;
  const showGlobalPatients =
    !loading && patients.length > 0 && searchQuery.length > 0;
  const showAddNew = !loading && searchQuery.length > 1;

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
            className="bg-white border border-gray-300 rounded-lg shadow-2xl z-110000 overflow-hidden"
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: "300px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#D1D5DB transparent",
              }}
            >
              {loading && (
                <div className="flex items-center justify-center p-4 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </div>
              )}

              {!loading && showHospitalPatients && (
                <>
                  <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-500" />
                      Patients from {hospitalName}
                    </p>
                  </div>
                  {availablePatients.map((patient) => (
                    <div
                      key={patient.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectHospitalPatient(patient);
                      }}
                      className="px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <User className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {patient.patientFullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {patient.patientAge
                            ? `Age ${patient.patientAge}`
                            : "No age"}{" "}
                          • {patient.mobileNumber || "No phone"}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loading && showGlobalPatients && (
                <>
                  <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-500" />
                      Other patients in system
                    </p>
                  </div>
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectGlobalPatient(patient);
                      }}
                      className="px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <User className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {patient.patientFullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {patient.patientAge
                            ? `Age ${patient.patientAge}`
                            : "No age"}{" "}
                          • {patient.mobileNumber || "No phone"}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loading && searchQuery.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs border-t border-gray-100">
                  <Info className="w-4 h-4 text-gray-400" />
                  Start typing to search for patients from our database.
                </div>
              )}

              {showAddNew && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
      dropdownPosition.top,
      dropdownPosition.left,
      dropdownPosition.width,
      loading,
      showHospitalPatients,
      availablePatients,
      hospitalName,
      showGlobalPatients,
      patients,
      searchQuery.length,
      showAddNew,
      handleSelectHospitalPatient,
      handleSelectGlobalPatient,
      handleAddNew,
    ]
  );

  return (
    <div id="patient" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      {/* Header */}
      <div
        className={`bg-linear-to-r ${getHeaderBg()} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <User className={"text-indigo-600"} size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Patient Information
              </h3>
            </div>
            <p
              className={
                "text-indigo-700 text-xs sm:text-sm font-medium leading-tight transition-colors duration-300 mt-1"
              }
            >
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Name Search */}
      <div className="mb-3 sm:mb-4 relative">
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
            {patientStatus === "hospital-filled" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled
              </span>
            )}
            {patientStatus === "global-filled" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled
              </span>
            )}
          </div>
        </div>
        <div className="relative flex items-center">
          <input
            ref={nameInputRef}
            type="text"
            className={
              inputClassName(localData.fullName, true, isPatientSelected) +
              " pr-44 sm:pr-56"
            }
            value={searchQuery}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder="Search by patient name or mobile number..."
            readOnly={isPatientSelected}
            autoComplete="off"
          />
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-row gap-2 items-center max-w-[70vw] sm:max-w-none">
            {patientStatus === "new" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <PlusCircle className="w-3 h-3 mr-1 text-indigo-500" />
                Adding as a new patient
              </span>
            )}
            {patientStatus === "hospital-filled" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <Building2 className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled from hospital
              </span>
            )}
            {patientStatus === "global-filled" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <User className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled from database
              </span>
            )}
            {isPatientSelected && (
              <button
                onClick={handleClearSelection}
                className="ml-2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                aria-label="Clear selection"
                style={{ zIndex: 2 }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {isPatientSelected && (
            <button
              onClick={handleClearSelection}
              className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
              aria-label="Clear selection"
              style={{ zIndex: 2 }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}

      {/* Patient Gender */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
          Patient Gender<span className="text-red-500">*</span>
        </label>
        <GenderDropdown
          value={localData.gender || "Female"}
          onSelect={(v) => handleFieldChange("gender", v)}
          style={{ width: "100%" }}
          autofilled={false}
        />
      </div>

      {/* Patient Age/DOB */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Patient Date of Birth
          </label>
          {autofilledFields.dateOfBirth && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-rose-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <DateOfBirthDropdown
            value={localData.dateOfBirth}
            onChange={handleDOBChange}
            placeholder="Select date of birth"
          />
          {autofilledFields.dateOfBirth && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Number */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Mobile Number<span className="text-red-500">*</span>
          </label>
          {autofilledFields.phoneNumber && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-rose-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <ContactPhoneInput
            value={localData.phoneNumber}
            onChange={(val) => handleFieldChange("phoneNumber", val)}
            onValidationChange={setIsPhoneValid}
            defaultCountry="BD"
            isAutofilled={autofilledFields.phoneNumber}
          />
          {autofilledFields.phoneNumber && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Email
          </label>
          {autofilledFields.email && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-rose-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <ContactEmailInput
            value={localData.email}
            onChange={(val) => handleFieldChange("email", val)}
            onValidationChange={setIsEmailValid}
            isAutofilled={autofilledFields.email}
          />
          {autofilledFields.email && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Address
          </label>
          {autofilledFields.address && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 shadow-sm">
                <User className="w-3 h-3 mr-1 text-rose-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <textarea
            className={`${inputClassName(
              localData.address,
              true,
              autofilledFields.address
            )} resize-none`}
            value={localData.address}
            onChange={(e) => handleFieldChange("address", e.target.value)}
            placeholder="Patient address"
            rows={2}
            disabled={autofilledFields.address}
          />
          {autofilledFields.address && (
            <div className="hidden sm:flex absolute right-3 top-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm pointer-events-none">
                <User className="w-3 h-3 mr-1 text-indigo-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PatientInformation.displayName = "PatientInformation";
export default React.memo(PatientInformation);
