import React, { useState, useRef, useCallback, useMemo } from "react";
import { ChevronDown, UserCircle2, Stethoscope } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useAuth } from "@/app/AuthContext";
import { useFetchDoctors } from "../hooks";

interface Doctor {
  id: number;
  fullName: string;
  specialization: string | null;
  role: string;
}

interface OrderingDoctorDropdownProps {
  value: number | null;
  onSelect: (value: number | null) => void;
  disabled?: boolean;
  inputClassName?: string;
}

const OrderingDoctorDropdown: React.FC<OrderingDoctorDropdownProps> = ({
  value,
  onSelect,
  disabled = false,
  inputClassName = "",
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: allStaff = [], isLoading } = useFetchDoctors();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      setIsOpen(open);
      if (!open) {
        setSearchTerm("");
      }
    },
    [disabled]
  );

  const handleSelect = useCallback(
    (doctorId: number | null) => {
      if (disabled) return;
      setIsOpen(false);
      setSearchTerm("");
      onSelect(doctorId);
    },
    [onSelect, disabled]
  );

  // Filter staff to only show those with "doctor" role (case-insensitive)
  const doctors = useMemo(() => {
    return allStaff.filter((staff) => staff.role.toLowerCase() === "doctor");
  }, [allStaff]);

  // Get selected doctor name
  const selectedDoctorName = useMemo(() => {
    if (value === null) return null;
    if (value === -1) return "Self";
    const doctor = doctors.find((d) => d.id === value);
    return doctor ? doctor.fullName : null;
  }, [value, doctors]);

  // Filter doctors based on search
  const filteredDoctors = useMemo(() => {
    if (!searchTerm) return doctors;
    const lowerSearch = searchTerm.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.fullName.toLowerCase().includes(lowerSearch) ||
        (doctor.specialization &&
          doctor.specialization.toLowerCase().includes(lowerSearch))
    );
  }, [doctors, searchTerm]);

  const dropdownItems = useMemo(
    () => (
      <>
        {/* Self Option */}
        <div
          onClick={() => handleSelect(-1)}
          className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center gap-3 ${
            disabled
              ? "cursor-not-allowed text-gray-400"
              : value === -1
              ? "bg-green-100 border-l-4 border-green-600"
              : "hover:bg-blue-900 hover:text-white"
          }`}
        >
          <UserCircle2 size={18} className="shrink-0" />
          <div className="flex-1">
            <span className="text-xs sm:text-sm font-semibold">Self</span>
            <div className="text-xs text-gray-500">Patient (self-referred)</div>
          </div>
        </div>

        {/* Divider */}
        {filteredDoctors.length > 0 && (
          <div className="border-t border-gray-200 my-1"></div>
        )}

        {/* Doctor Options */}
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            onClick={() => handleSelect(doctor.id)}
            className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center gap-3 ${
              disabled
                ? "cursor-not-allowed text-gray-400"
                : value === doctor.id
                ? "bg-green-100 border-l-4 border-green-600"
                : "hover:bg-blue-900 hover:text-white"
            }`}
          >
            <Stethoscope size={18} className="shrink-0" />
            <div className="flex-1">
              <span className="text-xs sm:text-sm font-semibold">
                {doctor.fullName}
              </span>
              {doctor.specialization && (
                <div className="text-xs text-gray-500">
                  {doctor.specialization}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* No Results */}
        {filteredDoctors.length === 0 && searchTerm && (
          <div className="px-4 py-6 text-center text-gray-500">
            <p className="text-xs sm:text-sm">No doctors found</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm("");
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </>
    ),
    [filteredDoctors, handleSelect, disabled, value, searchTerm]
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChange(!isOpen);
        }}
        disabled={disabled || isLoading}
        className={`${inputClassName} flex justify-between items-center pr-3! cursor-pointer`}
        type="button"
      >
        <span
          className={`flex items-center gap-2 ${
            value !== null
              ? "text-gray-700 font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm`}
        >
          {isLoading ? (
            "Loading doctors..."
          ) : selectedDoctorName ? (
            <>
              {value === -1 ? (
                <UserCircle2 size={16} className="text-green-600" />
              ) : (
                <Stethoscope size={16} className="text-blue-600" />
              )}
              {selectedDoctorName}
            </>
          ) : (
            "Select ordering doctor (Optional)"
          )}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="z-110000 overflow-hidden min-w-[280px]"
      >
        {/* Search Input */}
        {doctors.length > 5 && (
          <div className="sticky top-0 bg-gray-50 z-10 p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full p-2 rounded-lg border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm bg-white transition-all duration-150"
              autoFocus
            />
          </div>
        )}

        <div
          className="overflow-y-auto p-2"
          style={{ maxHeight: window.innerWidth < 640 ? "220px" : "280px" }}
        >
          {dropdownItems}
        </div>
      </DropdownPortal>
    </>
  );
};

export default OrderingDoctorDropdown;
