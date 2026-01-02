"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, Stethoscope } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchDoctors } from "../../../hooks";
import { usePathologyFilterStore } from "../../../stores/filterStore";

/**
 * Doctor Filter Dropdown
 * Uses DropdownPortal for proper positioning
 */
export const DoctorFilter: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: doctors = [] } = useFetchDoctors();
  const orderedById = usePathologyFilterStore(
    (state) => state.filters.orderedById
  );
  const setOrderedById = usePathologyFilterStore(
    (state) => state.setOrderedById
  );

  const selectedDoctor = doctors.find((d) => d.id === orderedById);
  const displayLabel = selectedDoctor?.fullName || "All Doctors";

  const handleSelect = (id: number | null) => {
    setOrderedById(id);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Stethoscope className="w-4 h-4 text-fnh-grey" />
        Doctor
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
            orderedById ? "text-gray-900 font-medium" : "text-gray-500"
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
        className="w-full min-w-[200px]"
      >
        <div className="py-1 max-h-[280px] overflow-y-auto">
          {/* All Doctors option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
              orderedById === null
                ? "bg-fnh-navy text-white font-medium"
                : "text-gray-700 hover:bg-slate-100"
            }`}
          >
            All Doctors
          </button>

          {/* Doctor options */}
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => handleSelect(doctor.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                orderedById === doctor.id
                  ? "bg-fnh-navy text-white font-medium"
                  : "text-gray-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-col">
                <span>{doctor.fullName}</span>
                {doctor.specialization && (
                  <span
                    className={`text-xs ${
                      orderedById === doctor.id
                        ? "text-gray-200"
                        : "text-gray-400"
                    }`}
                  >
                    {doctor.specialization}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default DoctorFilter;
