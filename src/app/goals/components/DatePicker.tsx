import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { DayPicker } from "react-day-picker";
import { createPortal } from "react-dom";
import "react-day-picker/dist/style.css";
interface DatePickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  placeholder: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onSelect,
  placeholder,
}) => {
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top - 320,
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
          selectedDate
            ? "bg-white border-green-500"
            : "bg-[#F0F4F8] border-red-500"
        } text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 outline-none shadow-sm hover:shadow-md transition-shadow duration-300`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedDate ? selectedDate.toLocaleDateString() : placeholder}
        </span>
      </button>
      {isOpen &&
        createPortal(
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <DayPicker
              selected={selectedDate ?? undefined}
              onDayClick={(day) => {
                onSelect(day);
                setIsOpen(false);
              }}
              mode="single"
              className="custom-calendar"
            />
          </motion.div>,
          document.body
        )}
    </div>
  );
};

export default DatePicker;
