"use client";

import React from "react";
import { User } from "lucide-react";
import { useFetchDoctors } from "../../../hooks/useFetchDoctors";
import { useInfertilityTestFilterStore } from "../../../stores/testFilterStore";

export const DoctorFilter: React.FC = () => {
  const { data: doctors, isLoading } = useFetchDoctors();
  const orderedById = useInfertilityTestFilterStore((state) => state.filters.orderedById);
  const setOrderedById = useInfertilityTestFilterStore((state) => state.setOrderedById);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        <User className="w-3.5 h-3.5" />
        Ordered By (Doctor)
      </label>
      <div className="relative">
        <select
          value={orderedById || ""}
          onChange={(e) => setOrderedById(e.target.value ? Number(e.target.value) : null)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm
            focus:ring-2 focus:ring-fnh-blue/20 focus:border-fnh-blue outline-none
            transition-all duration-200 appearance-none cursor-pointer"
          disabled={isLoading}
        >
          <option value="">All Doctors</option>
          {doctors?.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
