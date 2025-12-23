"use client";
import React, { useState, useRef } from "react";
import { ChevronDown, Check, Filter } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { motion, AnimatePresence } from "framer-motion";

interface ShiftStatusFilterProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const STATUS_OPTIONS = [
  { label: "All Status", value: "All", color: "blue" },
  { label: "Active", value: "Active", color: "green" },
  { label: "Closed", value: "Closed", color: "gray" },
];

export const ShiftStatusFilter: React.FC<ShiftStatusFilterProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption =
    STATUS_OPTIONS.find((o) => o.value === currentStatus) || STATUS_OPTIONS[0];

  const getStatusColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "text-blue-600 bg-blue-50 border-blue-100",
      green: "text-emerald-600 bg-emerald-50 border-emerald-100",
      gray: "text-gray-600 bg-gray-50 border-gray-100",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-all shadow-xs active:scale-95 ${getStatusColor(
          selectedOption.color
        )}`}
      >
        <Filter className="w-4 h-4" />
        {selectedOption.label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[180px]"
      >
        <div className="p-1">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === currentStatus;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 text-left rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-fnh-navy text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {isSelected && <Check size={14} className="text-white" />}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};
