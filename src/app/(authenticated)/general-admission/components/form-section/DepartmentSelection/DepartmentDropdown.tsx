"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from "react";
import { ChevronDown, Building2, Search } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchDepartments } from "../../../hooks";
import type { Department } from "../../../types";

interface DepartmentDropdownProps {
  value: number | null;
  onSelect: (value: number | null, department?: Department) => void;
  disabled?: boolean;
  inputClassName?: string;
}

// Memoized department item component for performance
const DepartmentItem = memo(
  ({
    department,
    isSelected,
    onSelect,
    disabled,
  }: {
    department: Department;
    isSelected: boolean;
    onSelect: (id: number) => void;
    disabled: boolean;
  }) => {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onSelect(department.id);
        }}
        className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center gap-3 ${
          disabled
            ? "cursor-not-allowed text-gray-400"
            : isSelected
            ? "bg-purple-100 border-l-4 border-purple-600"
            : "hover:bg-purple-900 hover:text-white"
        }`}
      >
        <Building2 size={18} className="shrink-0" />
        <div className="flex-1">
          <span className="text-xs sm:text-sm font-semibold">
            {department.name}
          </span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.department.id === nextProps.department.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.disabled === nextProps.disabled
);
DepartmentItem.displayName = "DepartmentItem";

const DepartmentDropdown: React.FC<DepartmentDropdownProps> = ({
  value,
  onSelect,
  disabled = false,
  inputClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: departments = [], isLoading } = useFetchDepartments();

  const toggleDropdown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || isLoading) return;
      setIsOpen((prev) => !prev);
    },
    [disabled, isLoading]
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const handleSelect = useCallback(
    (departmentId: number) => {
      if (disabled) return;
      const dept = departments.find((d) => d.id === departmentId);
      onSelect(departmentId, dept);
      closeDropdown();
    },
    [onSelect, disabled, closeDropdown, departments]
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const searchInput = document.querySelector(
        ".department-search-input"
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

  // Get selected department name
  const selectedDepartmentName = useMemo(() => {
    if (value === null) return null;
    const dept = departments.find((d) => d.id === value);
    return dept ? dept.name : null;
  }, [value, departments]);

  // Filter departments based on search
  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    const lowerSearch = searchTerm.toLowerCase();
    return departments.filter((dept) =>
      dept.name.toLowerCase().includes(lowerSearch)
    );
  }, [departments, searchTerm]);

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
            "Loading departments..."
          ) : selectedDepartmentName ? (
            <>
              <Building2 size={16} className="text-purple-600" />
              {selectedDepartmentName}
            </>
          ) : (
            "Select department"
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
          {/* Search Input - show when more than 5 departments */}
          {departments.length > 5 && (
            <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  className="department-search-input w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-purple-950 focus:ring-1 focus:ring-purple-200 focus:outline-none text-sm bg-white transition-all duration-150 placeholder:text-gray-400"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>{filteredDepartments.length} departments</span>
              </div>
            </div>
          )}

          {/* Departments List */}
          <div
            className="overflow-y-auto p-2"
            style={{
              maxHeight:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "220px"
                  : "280px",
            }}
          >
            {filteredDepartments.map((dept) => (
              <DepartmentItem
                key={dept.id}
                department={dept}
                isSelected={value === dept.id}
                onSelect={handleSelect}
                disabled={disabled}
              />
            ))}

            {/* No Results */}
            {filteredDepartments.length === 0 && searchTerm && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  No departments found
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                  type="button"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline transition-colors cursor-pointer"
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

export default DepartmentDropdown;
