"use client";

import React, { useState, useRef } from "react";
import { ChevronDown, Check, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

export interface StaffFilterOption {
  id: number;
  fullName: string;
  role: string;
}

interface StaffFilterProps {
  staff: StaffFilterOption[];
  currentStaffId: number | null;
  onStaffChange: (staffId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  showAllOption?: boolean;
}

export const StaffFilter: React.FC<StaffFilterProps> = ({
  staff,
  currentStaffId,
  onStaffChange,
  disabled = false,
  placeholder = "All Staff",
  className,
  dropdownClassName = "min-w-[220px] max-w-[280px]",
  showAllOption = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const filteredStaff = staff.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStaff = staff.find((s) => s.id === currentStaffId);

  const handleSelect = (staffId: number | null) => {
    onStaffChange(staffId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-2.5 w-full",
          "bg-white border border-gray-100 rounded-xl shadow-sm",
          "text-sm font-semibold text-gray-700",
          "focus:outline-none focus:ring-2 focus:ring-fnh-blue/20",
          "transition-all duration-200 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-fnh-blue/20 border-fnh-blue/30"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">
            {selectedStaff ? selectedStaff.fullName : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSearchTerm("");
        }}
        buttonRef={buttonRef}
        className={dropdownClassName}
      >
        <div className="py-1">
          {/* Search */}
          <div className="px-2 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-fnh-blue/20"
                autoFocus
              />
            </div>
          </div>

          {showAllOption ? (
            <>
              {/* All Staff Option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
                  "text-xs font-medium",
                  "hover:bg-gray-50 transition-colors cursor-pointer",
                  currentStaffId === null && "bg-fnh-blue/5",
                )}
              >
                <span className={cn(currentStaffId === null && "font-bold")}>
                  {placeholder}
                </span>
                {currentStaffId === null && (
                  <Check className="w-3.5 h-3.5 text-fnh-blue shrink-0" />
                )}
              </button>

              <div className="h-px bg-gray-100 my-1" />
            </>
          ) : null}

          {/* Staff Options */}
          <div className="max-h-[260px] overflow-y-auto">
            {filteredStaff.map((member) => {
              const isSelected = member.id === currentStaffId;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-left",
                    "text-xs",
                    "hover:bg-gray-50 transition-colors cursor-pointer",
                    isSelected && "bg-fnh-blue/5"
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn("truncate", isSelected && "font-bold")}>
                      {member.fullName}
                    </p>
                    <p className="text-[9px] text-gray-400 truncate uppercase tracking-tight">
                      {member.role}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-fnh-blue shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredStaff.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No staff found
              </div>
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
};
