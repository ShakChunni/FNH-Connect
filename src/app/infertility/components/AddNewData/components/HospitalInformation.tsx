import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Building2, PlusCircle, Loader2, Info, X } from "lucide-react";
import useFetchHospitalInformation, {
  Hospital,
} from "../hooks/useFetchHospitalInformation";
import { Tooltip as ReactTooltip } from "react-tooltip";
import HospitalTypeDropdown from "../Dropdowns/HospitalTypeDropdown";
import ContactPhoneInput from "./ContactPhoneInput";
import ContactEmailInput from "./ContactEmailInput";

export interface HospitalData {
  id: number | null;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website: string;
  type: string;
}

interface HospitalInformationProps {
  onDataChange: (data: HospitalData) => void;
  onDropdownToggle: (isOpen: boolean) => void;
  onMessage: (type: "success" | "error", content: string) => void;
  isMobile: boolean;
  titleTooltipStyle: React.CSSProperties;
}

const HospitalInformation: React.FC<HospitalInformationProps> = ({
  onDataChange,
  onDropdownToggle,
  onMessage,
  isMobile,
  titleTooltipStyle,
}) => {
  // Use the hook for fetching hospitals
  const { searchQuery, setSearchQuery, hospitals, loading, error } =
    useFetchHospitalInformation();

  // Display error to user when API fails
  useEffect(() => {
    if (error) {
      onMessage("error", error);
    }
  }, [error, onMessage]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localData, setLocalData] = useState<HospitalData>({
    id: null,
    name: "",
    address: "",
    phoneNumber: "",
    email: "",
    website: "",
    type: "",
  });

  const [autofilledFields, setAutofilledFields] = useState<{
    address: boolean;
    phoneNumber: boolean;
    email: boolean;
    website: boolean;
    type: boolean;
  }>({
    address: false,
    phoneNumber: false,
    email: false,
    website: false,
    type: false,
  });

  // Add validation states for phone and email
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const hospitalInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const [hospitalStatus, setHospitalStatus] = useState<"" | "existing" | "new">(
    ""
  );
  const [hospitalTouched, setHospitalTouched] = useState(false);

  const hospitalTypes = [
    "Government Hospital",
    "Private Hospital",
    "Clinic",
    "Medical Center",
    "Specialty Center",
    "Other",
  ];

  // Updated input styling to match PatientInformation
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

  useEffect(() => {
    onDataChange(localData);
  }, [localData, onDataChange]);

  const updateDropdownPosition = useCallback(() => {
    if (hospitalInputRef.current) {
      const rect = hospitalInputRef.current.getBoundingClientRect();
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
    setLocalData((prev) => ({
      ...prev,
      id: null,
      name: newQuery,
    }));
    setHospitalTouched(true);
    setHospitalStatus("");

    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
      onDropdownToggle(true);
    } else {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    }
  };

  const handleInputBlur = () => {
    if (!searchQuery || !hospitalTouched) {
      setHospitalStatus("");
      return;
    }

    if (localData.id) {
      setHospitalStatus("existing");
    } else if (searchQuery.length > 1) {
      setHospitalStatus("new");
    } else {
      setHospitalStatus("");
    }
  };

  const handleSelectHospital = useCallback(
    (hospital: Hospital) => {
      setTimeout(() => {
        setLocalData({
          id: hospital.id,
          name: hospital.name,
          address: hospital.address || "",
          phoneNumber: hospital.phoneNumber || "",
          email: hospital.email || "",
          website: hospital.website || "",
          type: hospital.type || "",
        });

        setAutofilledFields({
          address: !!hospital.address,
          phoneNumber: !!hospital.phoneNumber,
          email: !!hospital.email,
          website: !!hospital.website,
          type: !!hospital.type,
        });

        setSearchQuery(hospital.name);
        setIsDropdownOpen(false);
        onDropdownToggle(false);
        setHospitalStatus("existing");
        setHospitalTouched(true);
      }, 0);
    },
    [
      setLocalData,
      setAutofilledFields,
      setSearchQuery,
      setIsDropdownOpen,
      onDropdownToggle,
    ]
  );

  const handleAddNew = useCallback(() => {
    setTimeout(() => {
      setIsDropdownOpen(false);
      onDropdownToggle(false);
      setLocalData((prev) => ({
        ...prev,
        id: null,
        name: searchQuery,
        address: "",
        phoneNumber: "",
        email: "",
        website: "",
        type: "",
      }));

      setAutofilledFields({
        address: false,
        phoneNumber: false,
        email: false,
        website: false,
        type: false,
      });
      setHospitalTouched(true);
      setHospitalStatus("new");
    }, 0);
  }, [
    searchQuery,
    setIsDropdownOpen,
    onDropdownToggle,
    setLocalData,
    setAutofilledFields,
  ]);

  const handleClearSelection = () => {
    setLocalData({
      id: null,
      name: "",
      address: "",
      phoneNumber: "",
      email: "",
      website: "",
      type: "",
    });
    setSearchQuery("");
    setAutofilledFields({
      address: false,
      phoneNumber: false,
      email: false,
      website: false,
      type: false,
    });
    setHospitalStatus("");
    setHospitalTouched(false);
  };

  const handleLocalDataChange = (field: keyof HospitalData, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));

    // Remove autofill status when user manually edits
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

  const handleScroll = useCallback(
    (event: Event) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          return;
        }
        if (
          hospitalInputRef.current &&
          hospitalInputRef.current.contains(target)
        ) {
          return;
        }
        setIsDropdownOpen(false);
        onDropdownToggle(false);
      }
    },
    [isDropdownOpen, onDropdownToggle]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (hospitalInputRef.current && hospitalInputRef.current.contains(target))
      ) {
        return;
      }
      setIsDropdownOpen(false);
      onDropdownToggle(false);
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("scroll", handleScroll, { capture: true });
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDropdownPosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isDropdownOpen, onDropdownToggle, handleScroll]);

  const isHospitalSelected = localData.id !== null;

  useEffect(() => {
    if (!localData.name) {
      setLocalData((prev) => ({
        ...prev,
        address: "",
        phoneNumber: "",
        email: "",
        website: "",
        type: "",
      }));
      setAutofilledFields({
        address: false,
        phoneNumber: false,
        email: false,
        website: false,
        type: false,
      });
      setHospitalStatus("");
      setHospitalTouched(false);
    }
  }, [localData.name]);

  // Status message and dynamic header styling
  const getHeaderBg = () => {
    // Use blue theme for Hospital section (matches parent tab color)
    if (hospitalStatus === "new") {
      return "from-blue-50 to-blue-100 border-blue-200";
    }
    return "from-blue-50 to-blue-100 border-blue-200";
  };

  const getStatusBadge = () => {
    if (!hospitalStatus) return null;
    if (hospitalStatus === "existing") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold ml-2 border border-purple-200 shadow-sm">
          <Building2 className="w-3 h-3 mr-1 text-purple-500" />
          Auto-filled from hospital
        </span>
      );
    }
    if (hospitalStatus === "new") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold ml-2 border border-teal-200 shadow-sm">
          <PlusCircle className="w-3 h-3 mr-1 text-teal-500" />
          Adding as a new hospital
        </span>
      );
    }
    return null;
  };

  const getDescription = () => {
    if (hospitalStatus === "existing") {
      return "Hospital details have been auto-filled from our database.";
    }
    if (hospitalStatus === "new") {
      return "You are adding a new hospital. Please fill in all required details.";
    }
    return "Search for a hospital or add a new one to the system.";
  };

  const dropdownContent = (
    <AnimatePresence>
      {isDropdownOpen && !isHospitalSelected && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-2xl z-[60] overflow-hidden"
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
            {!loading &&
              hospitals.length > 0 &&
              hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectHospital(hospital);
                  }}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {hospital.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {hospital.type || "No type"} •{" "}
                      {hospital.address || "No address"}
                    </p>
                  </div>
                </div>
              ))}
            {!loading && searchQuery.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs border-t border-gray-100">
                <Info className="w-4 h-4 text-gray-400" />
                Start typing to search for hospitals from our database.
              </div>
            )}
            {!loading && searchQuery.length >= 1 && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddNew();
                }}
                className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-t border-gray-200"
              >
                <PlusCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="font-medium text-blue-700 text-sm">
                  Add &quot;{searchQuery}&quot; as a new hospital
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div id="hospital" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      <div
        className={`bg-gradient-to-r ${getHeaderBg()} rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
            <Building2 className={"text-blue-600"} size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Hospital Information
              </h3>
            </div>
            <p
              className={
                "text-blue-700 text-xs sm:text-sm font-medium leading-tight transition-colors duration-300 mt-1"
              }
            >
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Name Search */}
      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Hospital Name<span className="text-red-500">*</span>
          </label>
          {/* Mobile status badge next to label */}
          <div className="sm:hidden">
            {hospitalStatus === "new" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <PlusCircle className="w-3 h-3 mr-1 text-blue-500" />
                New
              </span>
            )}
            {hospitalStatus === "existing" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            )}
          </div>
        </div>
        <div className="relative flex items-center">
          <input
            ref={hospitalInputRef}
            type="text"
            className={
              inputClassName(localData.name, isHospitalSelected) +
              " pr-44 sm:pr-56"
            }
            value={searchQuery}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => {
              if (!isHospitalSelected && searchQuery.length >= 0) {
                updateDropdownPosition();
                setIsDropdownOpen(true);
                onDropdownToggle(true);
              }
            }}
            placeholder="Start typing to search for a hospital..."
            readOnly={isHospitalSelected}
          />
          {/* Desktop badge container: only show on sm and up */}
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-row gap-2 items-center max-w-[70vw] sm:max-w-none">
            {hospitalStatus === "new" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <PlusCircle className="w-3 h-3 mr-1 text-blue-500" />
                Adding as a new hospital
              </span>
            )}
            {hospitalStatus === "existing" && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm pointer-events-none whitespace-nowrap"
                style={{ zIndex: 2 }}
              >
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled from database
              </span>
            )}
            {isHospitalSelected && (
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
          {/* Mobile clear button: only show on mobile when hospital is selected */}
          {isHospitalSelected && (
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

      {/* Hospital Type */}
      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Hospital Type<span className="text-red-500">*</span>
          </label>
          {autofilledFields.type && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <HospitalTypeDropdown
            value={localData.type}
            onSelect={(v) => handleLocalDataChange("type", v)}
            options={hospitalTypes}
            disabled={autofilledFields.type}
            inputClassName={inputClassName(
              localData.type,
              true,
              autofilledFields.type
            )}
          />
          {autofilledFields.type && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm pointer-events-none">
                <Building2 className="w-3 h-3 mr-1 text-purple-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Phone Number */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
            Phone Number
          </label>
          {autofilledFields.phoneNumber && (
            <div className="sm:hidden">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-blue-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <ContactPhoneInput
            value={localData.phoneNumber}
            onChange={(val) => handleLocalDataChange("phoneNumber", val)}
            onValidationChange={setIsPhoneValid}
            defaultCountry="BD"
            isAutofilled={autofilledFields.phoneNumber}
          />
          {autofilledFields.phoneNumber && (
            <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm pointer-events-none">
                <Building2 className="w-3 h-3 mr-1 text-purple-500" />
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-purple-500" />
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
            onChange={(e) => handleLocalDataChange("address", e.target.value)}
            placeholder="Hospital address"
            rows={2}
            disabled={autofilledFields.address}
          />
          {autofilledFields.address && (
            <div className="hidden sm:flex absolute right-3 top-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm pointer-events-none">
                <Building2 className="w-3 h-3 mr-1 text-purple-500" />
                Auto-filled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Email and Website Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <label className="block text-gray-700 text-sm sm:text-base font-semibold">
              Email
            </label>
            {autofilledFields.email && (
              <div className="sm:hidden">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
                  <Building2 className="w-3 h-3 mr-1 text-purple-500" />
                  Auto-filled
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <ContactEmailInput
              value={localData.email}
              onChange={(val) => handleLocalDataChange("email", val)}
              onValidationChange={setIsEmailValid}
              placeholder="Hospital email"
              isAutofilled={autofilledFields.email}
            />
            {autofilledFields.email && (
              <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm pointer-events-none">
                  <Building2 className="w-3 h-3 mr-1 text-purple-500" />
                  Auto-filled
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Website */}
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <label className="block text-gray-700 text-sm sm:text-base font-semibold">
              Website
            </label>
            {autofilledFields.website && (
              <div className="sm:hidden">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
                  <Building2 className="w-3 h-3 mr-1 text-purple-500" />
                  Auto-filled
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="url"
              className={inputClassName(
                localData.website,
                true,
                autofilledFields.website
              )}
              value={localData.website}
              onChange={(e) => handleLocalDataChange("website", e.target.value)}
              placeholder="Hospital website"
              disabled={autofilledFields.website}
            />
            {autofilledFields.website && (
              <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm pointer-events-none">
                  <Building2 className="w-3 h-3 mr-1 text-purple-500" />
                  Auto-filled
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

HospitalInformation.displayName = "HospitalInformation";
export default React.memo(HospitalInformation);
