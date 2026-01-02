"use client";

import React, { useRef, useState } from "react";
import { ChevronDown, Activity } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import {
  usePathologyFilterStore,
  PathologyStatus,
} from "../../../stores/filterStore";

// Status options for pathology
const STATUS_OPTIONS: Array<{
  value: PathologyStatus;
  label: string;
  color: string;
}> = [
  { value: "All", label: "All Status", color: "gray" },
  { value: "Completed", label: "Completed", color: "green" },
  { value: "Pending", label: "Pending", color: "amber" },
];

/**
 * Status Filter Dropdown
 * Filters by pathology test status
 */
export const StatusFilter: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const status = usePathologyFilterStore((state) => state.filters.status);
  const setStatus = usePathologyFilterStore((state) => state.setStatus);

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status);
  const displayLabel = selectedStatus?.label || "All Status";

  const handleSelect = (value: PathologyStatus) => {
    setStatus(value);
    setIsOpen(false);
  };

  // Status color indicator
  const getStatusColor = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-500",
      amber: "bg-amber-500",
      gray: "bg-gray-500",
    };
    return colors[color] || "bg-gray-500";
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Activity className="w-4 h-4 text-fnh-grey" />
        Status
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
        <div className="flex items-center gap-2">
          {selectedStatus && (
            <span
              className={`w-2 h-2 rounded-full ${getStatusColor(
                selectedStatus.color
              )}`}
            />
          )}
          <span
            className={
              status !== "All" ? "text-gray-900 font-medium" : "text-gray-500"
            }
          >
            {displayLabel}
          </span>
        </div>
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
          {/* Status options */}
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                status === option.value
                  ? "bg-fnh-navy text-white font-medium"
                  : "text-gray-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === option.value
                      ? "bg-white"
                      : getStatusColor(option.color)
                  }`}
                />
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default StatusFilter;
