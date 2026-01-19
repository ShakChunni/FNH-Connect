"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchDepartments } from "../../../hooks";
import { useFilterStore } from "../../../stores/filterStore";

/**
 * Department Filter Dropdown
 * Uses DropdownPortal for proper positioning
 */
export const DepartmentFilter: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: departments = [] } = useFetchDepartments();
  const departmentId = useFilterStore((state) => state.filters.departmentId);
  const setDepartmentId = useFilterStore((state) => state.setDepartmentId);

  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const displayLabel = selectedDepartment?.name || "All Departments";

  const handleSelect = (id: number | null) => {
    setDepartmentId(id);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Building2 className="w-4 h-4 text-fnh-grey" />
        Department
      </label>

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3
          bg-white border border-gray-200 rounded-xl
          text-sm text-gray-700
          hover:border-fnh-blue hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue
          transition-all duration-200 cursor-pointer"
      >
        <span
          className={
            departmentId ? "text-gray-900 font-medium" : "text-gray-500"
          }
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[200px]"
      >
        <div className="py-1 max-h-[280px] overflow-y-auto">
          {/* All Departments option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
              departmentId === null
                ? "bg-fnh-navy text-white font-medium"
                : "text-gray-700 hover:bg-slate-100"
            }`}
          >
            All Departments
          </button>

          {/* Department options */}
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleSelect(dept.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                departmentId === dept.id
                  ? "bg-fnh-navy text-white font-medium"
                  : "text-gray-700 hover:bg-slate-100"
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default DepartmentFilter;
