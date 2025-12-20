import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from "react";
import { ChevronDown, UserCircle2, Stethoscope, Search } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchDoctors } from "../../../hooks";

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

// Memoized doctor item component for performance
const DoctorItem = memo(
  ({
    doctor,
    isSelected,
    onSelect,
    disabled,
    isSelf,
  }: {
    doctor: Doctor;
    isSelected: boolean;
    onSelect: (id: number) => void;
    disabled: boolean;
    isSelf: boolean;
  }) => {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onSelect(doctor.id);
        }}
        className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center gap-3 ${
          disabled
            ? "cursor-not-allowed text-gray-400"
            : isSelected
            ? "bg-green-100 border-l-4 border-green-600"
            : "hover:bg-blue-900 hover:text-white"
        }`}
      >
        {isSelf ? (
          <UserCircle2 size={18} className="shrink-0" />
        ) : (
          <Stethoscope size={18} className="shrink-0" />
        )}
        <div className="flex-1">
          <span className="text-xs sm:text-sm font-semibold">
            {isSelf ? "Self" : doctor.fullName}
          </span>
          <div className="text-xs text-gray-500">
            {isSelf
              ? "Patient (self-referred)"
              : doctor.specialization || "Doctor"}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.doctor.id === nextProps.doctor.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.disabled === nextProps.disabled
);
DoctorItem.displayName = "DoctorItem";

const OrderingDoctorDropdown: React.FC<OrderingDoctorDropdownProps> = ({
  value,
  onSelect,
  disabled = false,
  inputClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: allStaff = [], isLoading } = useFetchDoctors();

  // Simple toggle - same pattern as PathologyTestsDropdown
  const toggleDropdown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || isLoading) return;
      setIsOpen((prev) => !prev);
    },
    [disabled, isLoading]
  );

  // Simple close - same pattern as PathologyTestsDropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const handleSelect = useCallback(
    (doctorId: number) => {
      if (disabled) return;
      onSelect(doctorId);
      closeDropdown();
    },
    [onSelect, disabled, closeDropdown]
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const searchInput = document.querySelector(
        ".doctor-search-input"
      ) as HTMLInputElement;
      if (searchInput) {
        setTimeout(() => {
          searchInput.focus();
        }, 50);
      }
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Filter staff - "Self" should appear first, then doctors
  const { selfEntry, doctors } = useMemo(() => {
    const self = allStaff.find((staff) => staff.role.toLowerCase() === "self");
    const doctorList = allStaff.filter(
      (staff) => staff.role.toLowerCase() !== "self"
    );
    return { selfEntry: self, doctors: doctorList };
  }, [allStaff]);

  // Get selected doctor/self name
  const selectedDoctorName = useMemo(() => {
    if (value === null) return null;
    // Check if it's the Self entry
    if (selfEntry && value === selfEntry.id) return "Self";
    // Check doctors
    const doctor = doctors.find((d) => d.id === value);
    return doctor ? doctor.fullName : null;
  }, [value, doctors, selfEntry]);

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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      setSearchTerm(e.target.value);
    },
    []
  );

  return (
    <div className="relative w-full">
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={disabled || isLoading}
        type="button"
        className={`${inputClassName} flex justify-between items-center pr-3 cursor-pointer`}
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
              {selfEntry && value === selfEntry.id ? (
                <UserCircle2 size={16} className="text-green-600" />
              ) : (
                <Stethoscope size={16} className="text-blue-600" />
              )}
              {selectedDoctorName}
            </>
          ) : (
            "Select ordering doctor"
          )}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      {/* Dropdown Content via Portal */}
      <DropdownPortal
        isOpen={isOpen}
        onClose={closeDropdown}
        buttonRef={buttonRef}
        className="rounded-lg overflow-hidden"
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden w-full min-w-[280px]">
          {/* Search Input - always show for doctors */}
          {doctors.length > 5 && (
            <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  className="doctor-search-input w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-950 focus:ring-1 focus:ring-blue-200 focus:outline-none text-sm bg-white transition-all duration-150 placeholder:text-gray-400"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>
                  {filteredDoctors.length + (selfEntry ? 1 : 0)} options
                </span>
              </div>
            </div>
          )}

          {/* Doctors List */}
          <div
            className="overflow-y-auto p-2"
            style={{
              maxHeight:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "220px"
                  : "280px",
            }}
          >
            {/* Self Option - only show if Self entry exists and matches search */}
            {selfEntry &&
              (!searchTerm || "self".includes(searchTerm.toLowerCase())) && (
                <>
                  <DoctorItem
                    doctor={selfEntry}
                    isSelected={value === selfEntry.id}
                    onSelect={handleSelect}
                    disabled={disabled}
                    isSelf={true}
                  />
                  {/* Divider */}
                  {filteredDoctors.length > 0 && (
                    <div className="border-t border-gray-200 my-1"></div>
                  )}
                </>
              )}

            {/* Doctor Options */}
            {filteredDoctors.map((doctor) => (
              <DoctorItem
                key={doctor.id}
                doctor={doctor}
                isSelected={value === doctor.id}
                onSelect={handleSelect}
                disabled={disabled}
                isSelf={false}
              />
            ))}

            {/* No Results */}
            {filteredDoctors.length === 0 && searchTerm && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">No doctors found</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                  type="button"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
};

export default OrderingDoctorDropdown;
