"use client";
import React, { useState, useRef } from "react";
import { Activity, Check, ChevronDown, Loader2 } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { ADMISSION_STATUS_OPTIONS, AdmissionStatus } from "../../../types";
import {
  TONE_BADGE,
  TONE_DOT,
  TONE_TEXT,
  statusTone,
} from "@/lib/statusStyles";

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
  const currentTone = currentOption?.tone ?? statusTone(currentStatus);

  const handleSelect = (status: AdmissionStatus) => {
    setIsOpen(false);
    if (status !== currentStatus) {
      onStatusChange(status);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!isUpdating) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isUpdating}
        className={`flex h-9 w-9 items-center justify-center gap-0.5 rounded-md ring-1 ring-inset transition-colors hover:opacity-80 cursor-pointer ${
          TONE_BADGE[currentTone]
        } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Change status"
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
        <div className="px-2.5 py-1.5 border-b border-slate-100 bg-slate-50">
          <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
            Change Status
          </p>
        </div>

        {/* Options */}
        <div className="py-1">
          {ADMISSION_STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === currentStatus;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`flex min-h-9 w-full items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                  isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${TONE_DOT[option.tone]}`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? TONE_TEXT[option.tone] : "text-slate-700"
                    }`}
                  >
                    {option.label}
                  </span>
                </div>
                {isSelected && (
                  <Check size={12} className={TONE_TEXT[option.tone]} />
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
