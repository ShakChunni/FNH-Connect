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
import { useFetchHospitalInformation } from "../hooks";
import { Hospital, HospitalData } from "../../../types";
import {
  useInfertilityHospitalData,
  useInfertilityActions,
} from "../../../stores";

// We'll manage dropdown open state locally or via callback for now if needed by parent
// But per "no props" instruction, we try to self-contain or use store.
// However, z-index overlays often need parent coordination or just Portal.
// "onDropdownToggle" was used to notify parent, likely for some UI reason (overflow handling?).
// For now, I'll implement internal logic and if parent *must* know, we might need a UI store action.
// The user instruction "no other props or anything" suggests self-containment.

const HospitalSearch: React.FC = () => {
  const hospitalData = useInfertilityHospitalData();
  const { setHospitalData } = useInfertilityActions();

  const [searchQuery, setSearchQueryState] = useState(hospitalData.name || "");
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Sync with store
  useEffect(() => {
    if (hospitalData.name && hospitalData.name !== searchQuery) {
      setSearchQueryState(hospitalData.name);
    }
  }, [hospitalData.name, searchQuery]);

  const {
    data: hospitals = [],
    isLoading: loading,
    error, // We might need a way to show error. If "no props", maybe we just log or use a global toast store?
    // The original component accepted 'onMessage'.
    // I will assume for now we might leave error handling quiet or console.error unless I see a toast store.
    // Checked stores: existing stores seem to be data stores.
  } = useFetchHospitalInformation(searchQuery);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hospitalStatus, setHospitalStatus] = useState<"" | "existing" | "new">(
    ""
  );

  // Sync status
  useEffect(() => {
    if (hospitalData.id) {
      setHospitalStatus("existing");
    } else if (hospitalData.name && hospitalData.name.length > 0) {
      // If it has name but no ID, and we are 'touched', it might be new.
      // But logic depends on interaction.
    }
  }, [hospitalData]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const hospitalInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

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
        // Simple success/neutral logic. Real validation might be more complex.
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
    setHospitalData({
      ...hospitalData,
      id: null,
      name: newQuery,
    });

    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsDropdownOpen(true);
      setHospitalStatus("new"); // Tentatively new until selected
    } else {
      setIsDropdownOpen(false);
      setHospitalStatus("");
    }
  };

  const handleSelectHospital = useCallback(
    (hospital: Hospital) => {
      setHospitalData({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address || "",
        phoneNumber: hospital.phoneNumber || "",
        email: hospital.email || "",
        website: hospital.website || "",
        type: hospital.type || "",
      });
      setSearchQuery(hospital.name);
      setIsDropdownOpen(false);
      setHospitalStatus("existing");
    },
    [setHospitalData, setSearchQuery]
  );

  const handleAddNew = useCallback(() => {
    setIsDropdownOpen(false);
    setHospitalData({
      ...hospitalData,
      id: null,
      name: searchQuery,
      address: "",
      phoneNumber: "",
      email: "",
      website: "",
      type: "",
    });
    setHospitalStatus("new");
  }, [searchQuery, hospitalData, setHospitalData]);

  const handleClearSelection = () => {
    setHospitalData({
      id: null,
      name: "",
      address: "",
      phoneNumber: "",
      email: "",
      website: "",
      type: "",
    });
    setSearchQuery("");
    setHospitalStatus("");
  };

  // Close dropdown on outside click
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
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside, true);
      window.addEventListener("resize", updateDropdownPosition);
      // Also update on scroll?
      window.addEventListener("scroll", updateDropdownPosition, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  const isHospitalSelected = hospitalData.id !== null;

  // Render Dropdown via Portal
  const dropdownContent = useMemo(
    () => (
      <AnimatePresence>
        {isDropdownOpen && !isHospitalSelected && (
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
                hospitals.length > 0 &&
                hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectHospital(hospital);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Building2 className="w-5 h-5 text-gray-400 shrink-0" />
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
              {!loading &&
                searchQuery.length >= 1 &&
                !hospitals.some(
                  (h) => h.name.toLowerCase() === searchQuery.toLowerCase()
                ) && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddNew();
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-t border-gray-200"
                  >
                    <PlusCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="font-medium text-blue-700 text-sm">
                      Add &quot;{searchQuery}&quot; as a new hospital
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
      isHospitalSelected,
      dropdownPosition,
      loading,
      hospitals,
      searchQuery,
      handleSelectHospital,
      handleAddNew,
    ]
  );

  return (
    <>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold">
          Hospital Name<span className="text-red-500">*</span>
        </label>
        {hospitalStatus === "new" && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
            <PlusCircle className="w-3 h-3 mr-1 text-green-500" />
            New
          </span>
        )}
        {hospitalStatus === "existing" && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
            <Building2 className="w-3 h-3 mr-1 text-blue-500" />
            Auto-filled
          </span>
        )}
      </div>

      <div className="relative flex items-center mb-3 sm:mb-4">
        <input
          ref={hospitalInputRef}
          type="text"
          className={
            inputClassName(hospitalData.name, hospitalData.name.trim() !== "") +
            " pr-10"
          }
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isHospitalSelected && searchQuery.length >= 0) {
              updateDropdownPosition();
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Start typing to search for a hospital..."
          readOnly={isHospitalSelected}
        />
        {isHospitalSelected && (
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

export default HospitalSearch;
