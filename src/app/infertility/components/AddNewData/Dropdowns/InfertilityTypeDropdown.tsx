import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

interface InfertilityTypeDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  disabled?: boolean;
  inputClassName?: string;
}

const InfertilityTypeDropdown: React.FC<InfertilityTypeDropdownProps> = ({
  value,
  onSelect,
  options,
  disabled = false,
  inputClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownReady, setDropdownReady] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      if (open) {
        setDropdownReady(true);
        updateDropdownPosition();
        requestAnimationFrame(() => setIsOpen(true));
      } else {
        setIsOpen(false);
      }
    },
    [disabled, updateDropdownPosition]
  );

  const handleSelect = useCallback(
    (v: string) => {
      if (disabled) return;
      setIsOpen(false);
      onSelect(v);
    },
    [onSelect, disabled]
  );

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

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
    <AnimatePresence>
      {(isOpen || dropdownReady) && (
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
            if (!isOpen) setDropdownReady(false);
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
        className={`${inputClassName} flex justify-between items-center !pr-3`}
        type="button"
      >
        <span
          className={`flex items-center gap-2 ${
            value ? "text-gray-700 font-normal" : "text-gray-400 font-light"
          } text-xs sm:text-sm`}
        >
          {value || "Select type"}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>
      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default InfertilityTypeDropdown;
