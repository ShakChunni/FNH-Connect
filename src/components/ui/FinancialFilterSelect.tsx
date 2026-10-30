"use client";

import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { DropdownPortal } from "./DropdownPortal";

export interface FinancialFilterSelectProps {
  label: string;
  icon: LucideIcon;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  activeLabel: string;
}

export function FinancialFilterSelect({
  label,
  icon: Icon,
  value,
  onChange,
  activeLabel,
}: FinancialFilterSelectProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isActive = value === true;

  const handleSelect = (nextValue: boolean | null) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-fnh-grey" />
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors duration-200 hover:border-fnh-blue hover:bg-slate-50 focus:border-fnh-blue focus:outline-none focus:ring-2 focus:ring-fnh-blue/20"
      >
        <span className={isActive ? "font-medium text-slate-900" : "text-slate-500"}>
          {isActive ? activeLabel : `All patients · ${label.toLowerCase()}`}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[240px]"
      >
        <div className="py-1">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
              value === null
                ? "bg-fnh-navy font-medium text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            All patients
          </button>
          <button
            type="button"
            onClick={() => handleSelect(true)}
            className={`w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
              isActive
                ? "bg-fnh-navy font-medium text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {activeLabel}
          </button>
        </div>
      </DropdownPortal>
    </div>
  );
}
