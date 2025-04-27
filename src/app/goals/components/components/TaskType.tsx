import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface TaskTypeProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  error?: string | null;
}

const TaskType: React.FC<TaskTypeProps> = ({
  selectedValue,
  onSelect,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const options = useMemo(
    () => [
      "EMAIL",
      "CALL",
      "MESSAGE",
      "MEETING",
      "PROPOSAL",
      "SOCIAL MEDIA",
      "PROSPECT",
      "FOLLOW UP",
      "OTHER",
    ],
    []
  );

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  }, [isOpen]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !buttonRef.current?.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleSelectOption = useCallback(
    (option: string) => {
      onSelect(option);
      setIsOpen(false);
    },
    [onSelect]
  );

  const dropdownContent = useMemo(
    () => (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-[9999] overflow-hidden min-w-[200px]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelectOption(option)}
                className={`cursor-pointer px-4 py-3 transition-colors duration-150 hover:bg-blue-950 hover:text-white ${
                  selectedValue === option ? "bg-blue-900 text-white" : ""
                }`}
              >
                {option}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    ),
    [isOpen, dropdownPosition, options, selectedValue, handleSelectOption]
  );

  const getButtonClassName = useMemo(() => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-xl flex justify-between items-center w-full cursor-pointer px-4 py-3 h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (selectedValue) {
      return `bg-white border-2 border-green-500 ${baseClasses}`;
    } else if (error) {
      return `bg-white border-2 border-red-500 ${baseClasses}`;
    } else {
      return `bg-[#F0F4F8] border border-gray-300 ${baseClasses}`;
    }
  }, [selectedValue, error]);

  return (
    <div className="relative flex-1 p-1">
      <button
        ref={buttonRef}
        className={getButtonClassName}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`${!selectedValue && !error ? "text-gray-400" : ""}`}>
          {selectedValue || error || "Select Activity Type"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default React.memo(TaskType);
