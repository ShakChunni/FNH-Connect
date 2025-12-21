"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Check, ChevronDown, Loader2 } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Track mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 999999,
          }}
          className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-36 overflow-hidden"
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 border-b border-gray-100">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              Change Status
            </p>
          </div>

          {/* Options */}
          {ADMISSION_STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === currentStatus;
            const colors = getStatusColor(option.color);
            return (
              <motion.button
                key={option.value}
                whileHover={{ x: 1 }}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                  isSelected
                    ? `${colors.bg} ${colors.text}`
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  <span className="text-[11px] font-medium text-gray-700">
                    {option.label}
                  </span>
                </div>
                {isSelected && <Check size={10} className={colors.text} />}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

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

      {/* Portal Dropdown */}
      {mounted &&
        typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default StatusDropdown;
