import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Text } from "@radix-ui/themes";
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
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    value || defaultValue || ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedValue(value || defaultValue || "");
  }, [value, defaultValue]);

  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const handleSelect = useCallback(
    (v: string) => {
      if (disabled) return;

      // Close dropdown first
      setIsOpen(false);

      // Update state and call callbacks (only if they exist)
      setSelectedValue(v);
      onSelect(v);

      // Only call parent callbacks if they're provided
      if (onDropdownToggle !== (() => {})) {
        onDropdownToggle(false);
      }
      if (onDropdownOpenStateChange !== (() => {})) {
        onDropdownOpenStateChange(false);
      }
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      if (open) {
        setIsDropdownReady(true);
        updateDropdownPosition();
        requestAnimationFrame(() => setIsOpen(true));
      } else {
        setIsOpen(false);
      }

      // Only call parent callbacks if they're provided
      if (onDropdownToggle !== (() => {})) {
        onDropdownToggle(open);
      }
      if (onDropdownOpenStateChange !== (() => {})) {
        onDropdownOpenStateChange(open);
      }
    },
    [
      disabled,
      onDropdownToggle,
      onDropdownOpenStateChange,
      updateDropdownPosition,
    ]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);

        // Only call parent callbacks if they're provided
        if (onDropdownToggle !== (() => {})) {
          onDropdownToggle(false);
        }
        if (onDropdownOpenStateChange !== (() => {})) {
          onDropdownOpenStateChange(false);
        }
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, {
        passive: true,
      });
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition);
    };
  }, [isOpen, handleClickOutside, updateDropdownPosition]);

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
          <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
            {g}
          </Text>
        </div>
      )),
    [handleSelect, disabled]
  );

  const dropdownContent = (
    <AnimatePresence>
      {(isOpen || isDropdownReady) && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, height: 0 }}
          animate={
            isOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
          }
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-[60]"
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: window.innerWidth < 640 ? "300px" : "400px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
          onAnimationComplete={() => {
            if (!isOpen) setIsDropdownReady(false);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="overflow-y-auto p-2"
            style={{ maxHeight: window.innerWidth < 640 ? "220px" : "280px" }}
          >
            {dropdownItems}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
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

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default GenderDropdown;
