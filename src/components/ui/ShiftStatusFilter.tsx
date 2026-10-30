"use client";
import React, { useState, useRef } from "react";
import { ChevronDown, Check, Filter } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { motion, AnimatePresence } from "framer-motion";
import { statusTone, TONE_BADGE } from "@/lib/statusStyles";

interface ShiftStatusFilterProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  { label: "Status", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Closed", value: "Closed" },
];

export const ShiftStatusFilter: React.FC<ShiftStatusFilterProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption =
    STATUS_OPTIONS.find((o) => o.value === currentStatus) || STATUS_OPTIONS[0];

  const tone = statusTone(selectedOption.value);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between gap-2 px-4 py-2.5 border border-transparent ring-1 rounded-xl text-sm font-semibold transition-colors shadow-xs w-full ${
          disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
        } ${TONE_BADGE[tone]}`}
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {selectedOption.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
                    : "text-slate-600 hover:bg-slate-50"
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
