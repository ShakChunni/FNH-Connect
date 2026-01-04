"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, Check, ChevronDown, Loader2 } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { ADMISSION_STATUS_OPTIONS, AdmissionStatus } from "../../../types";

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: AdmissionStatus) => void;
  isUpdating?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  isUpdating = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentOption = ADMISSION_STATUS_OPTIONS.find(
    (o) => o.value === currentStatus
  );

  const getStatusColor = (color: string) => {
    const colors: Record<
      string,
      { bg: string; text: string; hover: string; dot: string }
    > = {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        hover: "hover:bg-blue-200",
        dot: "bg-blue-500",
      },
      amber: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        hover: "hover:bg-amber-200",
        dot: "bg-amber-500",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        hover: "hover:bg-purple-200",
        dot: "bg-purple-500",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-700",
        hover: "hover:bg-green-200",
        dot: "bg-green-500",
      },
      red: {
        bg: "bg-red-100",
        text: "text-red-700",
        hover: "hover:bg-red-200",
        dot: "bg-red-500",
      },
    };
    return colors[color] || colors.blue;
  };

  const handleSelect = (status: AdmissionStatus) => {
    setIsOpen(false);
    if (status !== currentStatus) {
      onStatusChange(status);
    }
  };

  const buttonColors = getStatusColor(currentOption?.color || "blue");

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (!isUpdating) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isUpdating}
        className={`p-1 rounded-md transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 flex items-center gap-0.5 ${
          buttonColors.bg
        } ${buttonColors.text} ${buttonColors.hover} ${
          isUpdating ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Change status"
      >
        {isUpdating ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Activity size={12} />
        )}
        <ChevronDown
          size={8}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Global Portal Dropdown */}
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[180px] z-100001"
      >
        {/* Header */}
        <div className="px-2.5 py-1.5 border-b border-gray-100 bg-gray-50/50">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Change Status
          </p>
        </div>

        {/* Options */}
        <div className="py-1">
          {ADMISSION_STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === currentStatus;
            const colors = getStatusColor(option.color);
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? `${colors.bg} ${colors.text}`
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shadow-sm ${colors.dot}`}
                  />
                  <span className="text-[11px] font-semibold text-gray-700">
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Check size={12} className={colors.text} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </>
  );
};

export default StatusDropdown;
