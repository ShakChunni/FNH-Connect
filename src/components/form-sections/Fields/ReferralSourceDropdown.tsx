import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
// portal handles animation; framer-motion not needed here
import { ChevronDown } from "lucide-react";
// createPortal not needed; using DropdownPortal for portal rendering
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface ReferralSourceDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  disabled?: boolean;
  inputClassName?: string;
}

const ReferralSourceDropdown: React.FC<ReferralSourceDropdownProps> = ({
  value,
  onSelect,
  options,
  disabled = false,
  inputClassName = "",
}) => {
  // identical logic as above
  const [isOpen, setIsOpen] = useState(false);
  // Use central DropdownPortal for positioning and outside click handling
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // dropdown position handled by DropdownPortal

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

  // DropdownPortal handles click outside and positioning

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

  const dropdownContent = (
    <div className="overflow-y-auto p-2" style={{ maxHeight: window.innerWidth < 640 ? 220 : 280 }}>
      {dropdownItems}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        disabled={disabled}
        className={`${inputClassName} flex justify-between items-center pr-3! ${disabled ? '' : 'cursor-pointer'}`}
        type="button"
      >
        <span
          className={`flex items-center gap-2 ${
            value ? "text-gray-700 font-normal" : "text-gray-400 font-light"
          } text-xs sm:text-sm`}
        >
          {value || "Select referral source"}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>
      <DropdownPortal isOpen={isOpen} onClose={() => handleOpenChange(false)} buttonRef={buttonRef} className="z-110000 overflow-hidden">
        {dropdownContent}
      </DropdownPortal>
    </>
  );
};

export default ReferralSourceDropdown;
