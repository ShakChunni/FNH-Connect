import React, { useState, useEffect, useCallback, useRef, FC } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface MeetingDateDropdownProps {
  onSelect: (value: Date) => void;
  defaultValue?: Date | null;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  hasChanged: boolean;
  prospectDate: Date | null;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
}

const MeetingDateDropdown: FC<MeetingDateDropdownProps> = ({
  onSelect,
  defaultValue = null,
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  hasChanged,
  prospectDate,
  onMessage,
  messagePopupRef,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [portalPosition, setPortalPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (defaultValue) {
      setSelectedDate(defaultValue);
    }
  }, [defaultValue]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    onDropdownToggle(false);
    onDropdownOpenStateChange(false);
  }, [onDropdownToggle, onDropdownOpenStateChange]);

  const handleDayClick = useCallback(
    (day: Date) => {
      if (day > new Date()) {
        onMessage("error", "Selected date cannot be in the future.");
        return;
      } else if (prospectDate && day < prospectDate) {
        onMessage("error", "Meeting date cannot be older than prospect date.");
        return;
      }

      setSelectedDate(day);
      onSelect(day);
      closeDropdown();
    },
    [onSelect, closeDropdown, prospectDate, onMessage]
  );

  const updatePortalPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setPortalPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        updatePortalPosition();
      }
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange, updatePortalPosition]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        isOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(
          messagePopupRef.current &&
          messagePopupRef.current.contains(event.target as Node)
        )
      ) {
        closeDropdown();
      }
    },
    [closeDropdown, isOpen, messagePopupRef]
  );

  // Setup scroll and click outside listeners
  useEffect(() => {
    // Click outside handler
    document.addEventListener("mousedown", handleClickOutside);

    // Only setup scroll handlers when dropdown is open
    if (isOpen) {
      const handleScroll = () => {
        closeDropdown();
      };

      const handleResize = () => {
        updatePortalPosition();
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });
      document.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true,
      });

      updatePortalPosition();

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, { capture: true });
        document.removeEventListener("scroll", handleScroll, { capture: true });
      };
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside, updatePortalPosition, closeDropdown]);

  const getButtonClassName = useCallback(() => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (!selectedDate) {
      return `bg-gray-50 border border-red-700 ring-2 ring-red-500 ${baseClasses}`;
    } else {
      return `bg-white border-2 border-green-700 ${baseClasses}`;
    }
  }, [selectedDate]);

  return (
    <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={style}>
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className={getButtonClassName()}
      >
        <span
          className={`${
            selectedDate
              ? "text-[#2A3136] font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedDate
            ? format(selectedDate, "dd/MM/yyyy")
            : "Select Meeting Date"}
        </span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={calendarRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "fixed",
                  top: portalPosition.top,
                  left: portalPosition.left,
                  zIndex: 99999,
                  backgroundColor: "white",
                  border: "1px solid #00000040",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                  width: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <DayPicker
                  selected={selectedDate ?? undefined}
                  onDayClick={handleDayClick}
                  mode="single"
                  className="custom-calendar"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default MeetingDateDropdown;
