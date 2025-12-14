import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { ChevronDown, User } from "lucide-react";

interface GenderDropdownProps {
  value?: string;
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle?: (isOpen: boolean) => void;
  onDropdownOpenStateChange?: (isOpen: boolean) => void;
  disabled?: boolean;
  autofilled?: boolean;
  noDefaultSelection?: boolean; // When true, don't pre-select any gender
}

const GENDERS = ["Female", "Male", "Other"];

const GenderDropdown: FC<GenderDropdownProps> = ({
  value = "",
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle = () => {},
  onDropdownOpenStateChange = () => {},
  disabled = false,
  autofilled = false,
  noDefaultSelection = false,
}) => {
  // When noDefaultSelection is true, ignore defaultValue and only use value
  const initialValue = noDefaultSelection
    ? value || ""
    : value || defaultValue || "";
  const [selectedValue, setSelectedValue] = useState<string>(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // When noDefaultSelection is true, only use explicit value
    const newValue = noDefaultSelection
      ? value || ""
      : value || defaultValue || "";
    setSelectedValue(newValue);
  }, [value, defaultValue, noDefaultSelection]);

  const handleSelect = useCallback(
    (v: string) => {
      if (disabled) return;

      setIsOpen(false);
      setSelectedValue(v);
      onSelect(v);
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [disabled, onDropdownToggle, onDropdownOpenStateChange]
  );

  const dropdownItems = useMemo(
    () =>
      GENDERS.map((g) => (
        <div
          key={g}
          onClick={() => handleSelect(g)}
          className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 ${
            disabled
              ? "cursor-not-allowed text-gray-400"
              : "hover:bg-blue-900 hover:text-white"
          }`}
        >
          <span className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
            {g}
          </span>
        </div>
      )),
    [handleSelect, disabled]
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
        className={`text-gray-700 font-normal rounded-lg flex justify-between items-center w-full px-3 sm:px-4 py-2 h-12 md:h-14 outline-none transition-all duration-300 border-2 ${
          disabled
            ? "bg-gray-200 border-gray-300 cursor-not-allowed"
            : selectedValue
            ? "bg-white border-green-700 cursor-pointer focus:border-blue-950 focus:ring-2 focus:ring-blue-950 shadow-sm hover:shadow-md"
            : "bg-gray-50 border-gray-300 cursor-pointer focus:border-blue-950 focus:ring-2 focus:ring-blue-950 shadow-sm hover:shadow-md"
        }`}
        style={style}
        type="button"
      >
        <span
          className={`flex items-center gap-2 ${
            selectedValue
              ? "text-gray-700 font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedValue || "Select Gender"}
        </span>

        {autofilled ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm ml-2 gap-1">
            <User className="w-3 h-3 mr-1 text-blue-500" />
            Auto-filled
          </span>
        ) : (
          <ChevronDown
            className={`transition-transform duration-200 text-gray-400 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={16}
          />
        )}
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

export default GenderDropdown;
