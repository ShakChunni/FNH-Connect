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
import { Building2, PlusCircle, Loader2, X } from "lucide-react";
import { useAdmissionHospitalData, useAdmissionActions } from "../../../stores";
import { useFetchHospitalInformation } from "../../../hooks";
import type { Hospital } from "../../../types";

const AdmissionHospitalSearch: React.FC = () => {
  const hospitalData = useAdmissionHospitalData();
  const { setHospitalData } = useAdmissionActions();

  const [searchQuery, setSearchQueryState] = useState(hospitalData.name || "");
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Use the extracted hook
  const { data: hospitals = [], isLoading: loading } =
    useFetchHospitalInformation(searchQuery);

  useEffect(() => {
    if (hospitalData.name !== searchQuery) {
      setSearchQueryState(hospitalData.name || "");
    }
  }, [hospitalData.name]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hospitalStatus, setHospitalStatus] = useState<"" | "existing" | "new">(
    ""
  );

  useEffect(() => {
    if (hospitalData.id) {
      setHospitalStatus("existing");
    } else if (hospitalData.name && hospitalData.name.length > 0) {
      setHospitalStatus("new");
    } else {
      setHospitalStatus("");
    }
  }, [hospitalData.id, hospitalData.name]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const hospitalInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-slate-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm transition-colors placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string,
      isValid: boolean = true,
      disabled: boolean = false
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
      setHospitalStatus("new");
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
      window.addEventListener("scroll", updateDropdownPosition, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  const isHospitalSelected = hospitalData.id !== null;

  const dropdownContent = useMemo(
    () => (
      <AnimatePresence>
        {isDropdownOpen && !isHospitalSelected && (
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
                hospitals.length > 0 &&
                hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectHospital(hospital);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-b border-slate-100 last:border-b-0"
                  >
                    <Building2 className="w-5 h-5 text-slate-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {hospital.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
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
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 flex items-center gap-3 border-t border-slate-200"
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
        <label className="block text-slate-700 text-sm sm:text-base font-semibold">
          Hospital Name<span className="text-red-600">*</span>
        </label>
        {hospitalStatus === "new" && (
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${TONE_BADGE.info}`}>
            <PlusCircle className="w-3 h-3 mr-1 text-blue-600" />
            New
          </span>
        )}
        {hospitalStatus === "existing" && (
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${TONE_BADGE.info}`}>
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
            " pr-12"
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

export default AdmissionHospitalSearch;
