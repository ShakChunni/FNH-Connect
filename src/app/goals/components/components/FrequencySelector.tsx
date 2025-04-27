import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface FrequencySelectorProps {
  selectedFrequency: string | null;
  onSelectFrequency: (value: string) => void;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  selectedFrequency,
  onSelectFrequency,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <strong className="text-black w-32">Frequency:</strong>
      <div className="flex flex-1">
        <Dropdown
          options={["Daily", "Weekly", "Continuous"]}
          selectedValue={selectedFrequency || ""}
          onSelect={onSelectFrequency}
        />
      </div>
    </div>
  );
};

const Dropdown: React.FC<{
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}> = ({ options, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative flex-1">
      <button
        ref={buttonRef}
        className={`${
          selectedValue
            ? "bg-white border border-green-500"
            : "bg-[#F0F4F8] border border-gray-200"
        } text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 outline-none shadow-sm hover:shadow-md transition-shadow duration-300`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedValue || "Select"}</span>
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
      {createPortal(
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] overflow-hidden w-fit min-w-[200px]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
            >
              {options.map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className={`cursor-pointer px-4 py-3 hover:bg-violet-600 hover:text-white transition-colors duration-150 ${
                    selectedValue === option ? "bg-violet-600 text-white" : ""
                  }`}
                >
                  <span>{option}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default FrequencySelector;
