import React, { useState, useRef, useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface BloodGroupDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  disabled?: boolean;
  inputClassName?: string;
}

const BloodGroupDropdown: React.FC<BloodGroupDropdownProps> = ({
  value,
  onSelect,
  options,
  disabled = false,
  inputClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      setIsOpen(open);
    },
    [disabled]
  );

  const handleSelect = useCallback(
    (v: string) => {
      if (disabled) return;
      setIsOpen(false);
      onSelect(v);
    },
    [onSelect, disabled]
  );

  const dropdownItems = useMemo(
    () =>
      options.map((opt) => (
        <div
          key={opt}
          onClick={() => handleSelect(opt)}
          className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 ${
            disabled
              ? "cursor-not-allowed text-gray-400"
              : "hover:bg-blue-900 hover:text-white"
          }`}
        >
          <span className="text-xs sm:text-sm">{opt}</span>
        </div>
      )),
    [options, handleSelect, disabled]
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChange(!isOpen);
        }}
        disabled={disabled}
        className={`${inputClassName} flex justify-between items-center pr-3! cursor-pointer`}
        type="button"
      >
        <span
          className={`flex items-center gap-2 ${
            value ? "text-gray-700 font-normal" : "text-gray-400 font-light"
          } text-xs sm:text-sm`}
        >
          {value || "Select blood group"}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="z-110000 overflow-hidden"
      >
        <div
          className="overflow-y-auto p-2"
          style={{ maxHeight: window.innerWidth < 640 ? "220px" : "280px" }}
        >
          {dropdownItems}
        </div>
      </DropdownPortal>
    </>
  );
};

export default BloodGroupDropdown;
